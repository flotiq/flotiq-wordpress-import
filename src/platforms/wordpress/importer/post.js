import * as notify from '../../../helpers/notify.js';
import * as connect from '../helpers/connect.js';
import * as convertHelper from '../helpers/convert.js';
import postContentType from '../../../content-type-definitions/contentType4.json' with { type: 'json' };
import tagContentType from '../../../content-type-definitions/contentType2.json' with { type: 'json' };
import categoryContentType from '../../../content-type-definitions/contentType3.json' with { type: 'json' };
import authorContentType from '../../../content-type-definitions/contentType1.json' with { type: 'json' };
import { flotiq } from '../../../helpers/flotiq.js';

export const importer = async (apiKey, wordpressUrl, mediaArray) => {
    console.log('Importing posts to Flotiq');
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;

    for(page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'posts');
        if(!(wordpressResponse && wordpressResponse.totalPages && wordpressResponse.totalCount)){
            return;
        }
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let postsConverted = [];
        responseJson.map(async (post) => {
            postsConverted.push(convert(post, mediaArray));
        })
        let result = await flotiq(apiKey, postContentType.name, postsConverted);
        let json;
        let text;
        try{
            text = await result.text();
            console.log(text);
            json = JSON.parse(text);

        }catch (e) {
            console.log(text);
        }
        if(json && json.batch_success_count && json.errors.length === 0){
            imported+=json.batch_success_count;
        }
        notify.resultNotify(result, 'Posts from page', page, json);
        console.log('Posts progress: ' + imported + '/' + totalCount);

    }

    function convert(post, mediaArray) {
        let tags = post.tags.length ? post.tags.map((tag) => {
            return {
                type: 'internal',
                dataUrl: '/api/v1/content/' + tagContentType.name + '/' + tagContentType.name + '_' + tag
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
                type: 'internal',
                dataUrl: '/api/v1/content/_media/' + mediaArray[post.featured_media].id
            }] : [],
            tags: tags,
            categories: categories

        }
    }
};
