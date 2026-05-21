import * as contentTypeDefinitions from '../../helpers/content-type-definitions.js';
import * as author from './importer/author.js';
import * as category from './importer/category.js';
import * as tag from './importer/tag.js';
import * as post from './importer/post.js';
import * as page from './importer/page.js';
import * as media from './importer/media.js';
import logger from "@flotiq/api/src/logger.js";

const startImport = (apiKey, wordpressUrl) => {
    contentTypeDefinitions.importer(apiKey).then(async () => {
        author.importer(apiKey, wordpressUrl).then(async () => {
            tag.importer(apiKey, wordpressUrl).then(async () => {
                category.importer(apiKey, wordpressUrl).then(async () => {
                    media.importer(apiKey, wordpressUrl).then(async (mediaArray) => {
                        await post.importer(apiKey, wordpressUrl, mediaArray);
                        await page.importer(apiKey, wordpressUrl, mediaArray);
                        logger.info('Finished');
                    })
                })
            })
        })
    });
};

export default startImport;
