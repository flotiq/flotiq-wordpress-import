import * as connect from '../helpers/connect.js';
import * as convertHelper from '../helpers/convert.js';
import pageContentType from '../../../content-type-definitions/contentType5.json' with {type: 'json'};
import authorContentType from '../../../content-type-definitions/contentType1.json' with {type: 'json'};
import {getFlotiqApi} from '@flotiq/api';
import logger from '@flotiq/api/src/logger.js';
import config from '../../../configuration/config.js';
import {isQuotaError} from '../../../helpers/notify.js';

export const importer = async (apiKey, wordpressUrl, mediaArray) => {
    logger.info('Importing pages to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey);
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;
    let pagesWithParent = [];
    let quotaExceeded = false;

    for (page; page <= totalPages && !quotaExceeded; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'pages');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let pagesConverted = [];
        responseJson.map(async (page) => {
            pagesConverted.push(convert(page, mediaArray));
            if (page.parent) {
                pagesWithParent.push(convert2(page, mediaArray));
            }
        })
        try {
            await flotiqClient.persistContentObjectBatch(pageContentType.name, pagesConverted);
        } catch (error) {
            if (isQuotaError(error)) {
                logger.error('Quota exceeded. Stopping pages import.');
                quotaExceeded = true;
            } else {
                throw error;
            }
        }
    }

    if (!quotaExceeded && pagesWithParent.length) {
        page = 0;
        imported = 0;
        totalPages = Math.ceil(pagesWithParent.length / 25);
        for (page; page < totalPages && !quotaExceeded; page++) {
            try {
                await flotiqClient.persistContentObjectBatch(pageContentType.name, pagesWithParent.slice(page * 25, (page + 1) * 25));
                imported++;
                logger.info('Updating pages parents progress: ' + imported + '/' + pagesWithParent.length);
            } catch (error) {
                if (isQuotaError(error)) {
                    logger.error('Quota exceeded. Stopping pages parents update.');
                    quotaExceeded = true;
                } else {
                    throw error;
                }
            }
        }
    }
};

function convert(page, mediaArray) {
    let content = convertHelper.convertContent(page.content.rendered, mediaArray);

    // Add placeholder if featured media is not available
    if (page.featured_media && !mediaArray[page.featured_media]) {
        content += '\n\n[Placeholder Image - Featured image was not uploaded]';
    }
    return {
        id: pageContentType.name + '_' + page.id,
        slug: page.slug,
        title: page.title.rendered,
        status: page.status,
        created: page.date,
        modified: page.modified,
        content: content,
        author: [{
            type: 'internal',
            dataUrl: '/api/v1/content/' + authorContentType.name + '/' + authorContentType.name + '_' + page.author
        }],
        featuredMedia: page.featured_media && mediaArray[page.featured_media] ? [{
            type: 'internal',
            dataUrl: '/api/v1/content/_media/' + mediaArray[page.featured_media].id
        }] : []

    }
}

function convert2(page, mediaArray) {
    return {
        ...convert(page, mediaArray),
        parentPage: page.parent ? [{
            type: 'internal',
            dataUrl: '/api/v1/content/' + pageContentType.name + '/' + pageContentType.name + '_' + page.parent
        }] : []
    }
}
