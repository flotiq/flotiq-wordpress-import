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

    for (page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'tags');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let tagsConverted = [];
        responseJson.map(async (tag) => {
            tagsConverted.push(convert(tag));
        })
        if (!tagsConverted.length) {
            break;
        }
        let result = await flotiq(apiKey, tagContentType.name, tagsConverted);
        let json;
        let text;
        try {
            text = await result.text()
            console.log(text);
            json = JSON.parse(text);

        } catch (e) {
            console.log(text);
        }
        if (json && json.batch_success_count && json.errors.length === 0) {
            imported += json.batch_success_count;
        }
        notify.resultNotify(result, 'Tags from page', page, json);
        console.log('Tags progress: ' + imported + '/' + totalCount);
    }

    function convert(tag) {
        return {
            id: tagContentType.name + '_' + tag.id,
            slug: tag.slug,
            name: tag.name,
            description: tag.description
        }
    }
};
