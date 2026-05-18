import * as notify from '../../../helpers/notify.js';
import * as connect from '../helpers/connect.js';
import { flotiq } from '../../../helpers/flotiq.js';
import tagContentType from '../../../content-type-definitions/contentType2.json' with { type: 'json' };

export const importer = async (apiKey, wordpressUrl) => {
    console.log('Importing tags to Flotiq');
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;

    for(page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'tags');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let tagsConverted = [];

        responseJson.map(async (tag) => {
            tagsConverted.push(convert(tag));
        })

        let result = await flotiq(apiKey, tagContentType.name, tagsConverted);
        let json;
        try {
            json = await result.json();
        } catch (e) {
            console.error('Error parsing response:', e);
        }
        notify.resultNotify(result, 'Tags from page', page, json);
        if (json) {
            imported += json.batch_success_count;
        }
        console.log('Tags progress: ' + imported + '/' + totalCount);
    }

    function convert(tag) {
        return {
            id: tagContentType.name + '_' + tag.ID,
            slug: tag.slug,
            name: tag.name,
            description: tag.description
        }
    }
};
