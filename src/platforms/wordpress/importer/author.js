import config from '../../../configuration/config.js';
import {getFlotiqApi} from '@flotiq/api';
import logger from '@flotiq/api/src/logger.js';
import * as connect from '../helpers/connect.js';
import authorContentType from '../../../content-type-definitions/contentType1.json' with {type: 'json'};
import {isQuotaError} from '../../../helpers/notify.js';

export const importer = async (apiKey, wordpressUrl) => {
    logger.info('# Importing authors to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey)
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let quotaExceeded = false;

    for (page; page <= totalPages && !quotaExceeded; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'users');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let authorsConverted = [];

        if (typeof responseJson == 'undefined' || responseJson.length === 0) {
            responseJson = [{
                id: 1,
                slug: 'unknown_author',
                name: 'Unknown Author',
                description: 'unknown author'
            }];
            logger.warn("Can't fetch authors! Created default 'unknown' author.")
        }

        responseJson.map(async (author) => {
            authorsConverted.push(convert(author));
        })

        try {
            await flotiqClient.persistContentObjectBatch(authorContentType.name, authorsConverted);
        } catch (error) {
            if (isQuotaError(error)) {
                logger.error('Quota exceeded. Stopping authors import.');
                quotaExceeded = true;
            } else {
                throw error;
            }
        }
    }

    function convert(author) {
        return {
            id: authorContentType.name + '_' + author.id,
            slug: author.slug,
            name: author.name,
            description: author.description
        }
    }
};
