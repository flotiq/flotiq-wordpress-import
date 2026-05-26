import * as connect from '../helpers/connect.js';
import tagContentType from '../../../content-type-definitions/contentType2.json' with {type: 'json'};
import logger from "@flotiq/api/src/logger.js";
import {getFlotiqApi} from "@flotiq/api";
import config from "../../../configuration/config.js";

export const importer = async (apiKey, wordpressUrl) => {
    logger.info('# Importing tags to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey)
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;

    for (page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'tags');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let tagsConverted = [];

        responseJson.map(async (tag) => {
            tagsConverted.push(convert(tag));
        })

        await flotiqClient.persistContentObjectBatch(tagContentType.name, tagsConverted);
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
