import * as connect from '../helpers/connect.js';
import categoryContentType from '../../../content-type-definitions/contentType3.json' with {type: 'json'};
import logger from "@flotiq/api/src/logger.js";
import {getFlotiqApi} from "@flotiq/api";
import config from "../../../configuration/config.js";

export const importer = async (apiKey, wordpressUrl) => {
    logger.info('# Importing categories to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey)
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    0;
    let categoriesWithParent = [];

    for (page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'categories');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let categoriesConverted = [];
        responseJson.map(async (category) => {
            categoriesConverted.push(convert(category));
            if (category.parent) {
                categoriesWithParent.push(convert2(category));
            }
        })
        await flotiqClient.persistContentObjectBatch(categoryContentType.name, categoriesConverted);
    }

    if (categoriesWithParent.length) {
        page = 0;
        totalPages = Math.ceil(categoriesWithParent.length / 25);
        for (page; page < totalPages; page++) {
            await flotiqClient.persistContentObjectBatch(categoryContentType.name, categoriesWithParent.slice(page * 25, (page + 1) * 25));
        }
    }

    function convert(category) {
        return {
            id: categoryContentType.name + '_' + category.id,
            slug: category.slug,
            name: category.name,
            description: category.description
        }
    }

    function convert2(category) {
        return {
            ...convert(category),
            parentCategory: category.parent ? [{
                type: "internal",
                dataUrl: '/api/v1/content/' + categoryContentType.name + '/' + categoryContentType.name + '_' + category.parent
            }] : []
        }
    }
};
