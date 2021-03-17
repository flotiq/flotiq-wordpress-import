const content_type_definitions = require('../../helpers/content-type-definitions');
const author = require('./importer/author');
const category = require('./importer/category');
const custom = require('./../../console/console');
const tag = require('./importer/tag');
const post = require('./importer/post');
const page = require('./importer/page');
const media = require('./importer/media');
const errors = [];
const stdOut = [];
let errorObject = {errorCode: 0};
const oldConsole = console;

module.exports = startImport = (apiKey, wordpressUrl, isJson = false) => {
    console = custom.console(oldConsole, isJson, errors, stdOut, errorObject);


    content_type_definitions.importer(apiKey).then(async () => {
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
}
