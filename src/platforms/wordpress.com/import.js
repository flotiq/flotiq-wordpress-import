const content_type_definitions = require('./../../helpers/content-type-definitions');
const category = require('./importer/category');
const custom = require('./../../console/console');
const tag = require('./importer/tag');
const post = require('./importer/post');
const errors = [];
const stdOut = [];
let errorObject = {errorCode: 0};
const oldConsole = console;

module.exports = startImport = (apiKey, wordpressUrl, isJson = false) => {
    console = custom.console(oldConsole, isJson, errors, stdOut, errorObject);

    content_type_definitions.importer(apiKey).then(async () => {
        tag.importer(apiKey, wordpressUrl).then(async () => {
            category.importer(apiKey, wordpressUrl).then(async () => {
                await post.importer(apiKey, wordpressUrl);
                console.log('Finished');
            })
        })
    });
}
