import * as contentTypeDefinitions from './../../helpers/content-type-definitions.js';
import * as category from './importer/category.js';
import * as tag from './importer/tag.js';
import * as post from './importer/post.js';
import logger from "@flotiq/api/src/logger.js";

const startImport = (apiKey, wordpressUrl) => {
    contentTypeDefinitions.importer(apiKey).then(async () => {
        tag.importer(apiKey, wordpressUrl).then(async () => {
            category.importer(apiKey, wordpressUrl).then(async () => {
                await post.importer(apiKey, wordpressUrl);
                logger.info('Finished');
            })
        })
    });
};

export default startImport;
