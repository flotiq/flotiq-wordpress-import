import * as contentTypeDefinitions from './../../helpers/content-type-definitions.js';
// import * as category from './importer/category.js';
import * as custom from './../../console/console.js';
// import * as tag from './importer/tag.js';
// import * as post from './importer/post.js';
const errors = [];
const stdOut = [];
let errorObject = {errorCode: 0};
const oldConsole = console;

const startImport = (apiKey, wordpressUrl, isJson = false) => {
    console = custom.console(oldConsole, isJson, errors, stdOut, errorObject);

    contentTypeDefinitions.importer(apiKey).then(async () => {
        // tag.importer(apiKey, wordpressUrl).then(async () => {
        //     category.importer(apiKey, wordpressUrl).then(async () => {
        //         await post.importer(apiKey, wordpressUrl);
        //         console.log('Finished');
        //     })
        // })
    });
};

export default startImport;
