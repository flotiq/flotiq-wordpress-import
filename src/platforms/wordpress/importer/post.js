import * as connect from '../helpers/connect.js';
import * as convertHelper from '../helpers/convert.js';
import postContentType from '../../../content-type-definitions/contentType4.json' with {type: 'json'};
import tagContentType from '../../../content-type-definitions/contentType2.json' with {type: 'json'};
import categoryContentType from '../../../content-type-definitions/contentType3.json' with {type: 'json'};
import authorContentType from '../../../content-type-definitions/contentType1.json' with {type: 'json'};
import {getFlotiqApi} from '@flotiq/api';
import logger from '@flotiq/api/src/logger.js';
import config from '../../../configuration/config.js';
import {isQuotaError} from '../../../helpers/notify.js';

export const importer = async (apiKey, wordpressUrl, mediaArray) => {
    logger.info('# Importing posts to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey);
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let quotaExceeded = false;

    for (page; page <= totalPages && !quotaExceeded; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'posts');
        if (!(wordpressResponse && wordpressResponse.totalPages && wordpressResponse.totalCount)) {
            return;
        }
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let postsConverted = [];
        responseJson.map(async (post) => {
            postsConverted.push(convert(post, mediaArray));
        })
        try {
            await flotiqClient.persistContentObjectBatch(postContentType.name, postsConverted);
        } catch (error) {
            if (isQuotaError(error)) {
                logger.error('Quota exceeded. Stopping posts import.');
                quotaExceeded = true;
            } else {
                throw error;
            }
        }
    }
};

function convert(post, mediaArray) {
    let tags = post.tags.length ? post.tags.map((tag) => {
        return {
            type: 'internal', dataUrl: '/api/v1/content/' + tagContentType.name + '/' + tagContentType.name + '_' + tag
        };
    }) : [];
    let categories = post.categories.length ? post.categories.map((category) => {
        return {
            type: 'internal',
            dataUrl: '/api/v1/content/' + categoryContentType.name + '/' + categoryContentType.name + '_' + category
        };
    }) : [];

    let content = convertHelper.convertContent(post.content.rendered, mediaArray);

    // Add placeholder if featured media is not available
    if (post.featured_media && !mediaArray[post.featured_media]) {
        content += '\n\n[Placeholder Image - Featured image was not uploaded]';
    }

    return {
        id: postContentType.name + '_' + post.id,
        slug: post.slug,
        title: post.title.rendered,
        status: post.status,
        type: post.type,
        created: post.date,
        modified: post.modified,
        content: content,
        excerpt: post.excerpt.rendered,
        author: [{
            type: 'internal',
            dataUrl: '/api/v1/content/' + authorContentType.name + '/' + authorContentType.name + '_' + post.author
        }],
        featuredMedia: post.featured_media && mediaArray[post.featured_media] ? [{
            type: 'internal', dataUrl: '/api/v1/content/_media/' + mediaArray[post.featured_media].id
        }] : [],
        tags: tags,
        categories: categories
    }
}
