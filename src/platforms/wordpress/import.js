import * as contentTypeDefinitions from '../../helpers/content-type-definitions.js';
import * as author from './importer/author.js';
import * as category from './importer/category.js';
import * as custom from './../../console/console.js';
import * as tag from './importer/tag.js';
import * as post from './importer/post.js';
import * as page from './importer/page.js';
import * as media from './importer/media.js';
const errors = [];
const stdOut = [];
let errorObject = {errorCode: 0};
const oldConsole = console;

const startImport = (apiKey, wordpressUrl, isJson = false) => {
    console = custom.console(oldConsole, isJson, errors, stdOut, errorObject);


    contentTypeDefinitions.importer(apiKey).then(async () => {
        author.importer(apiKey, wordpressUrl).then(async () => {
            tag.importer(apiKey, wordpressUrl).then(async () => {
                category.importer(apiKey, wordpressUrl).then(async () => {
                    media.importer(apiKey, wordpressUrl).then(async (mediaArray) => {
                        await post.importer(apiKey, wordpressUrl, mediaArray);
                        await page.importer(apiKey, wordpressUrl, mediaArray);
                        console.log('Finished');
                    })
                })
            })
        })
    });
};

export default startImport;
