#!/usr/bin/env node

const inquirer = require("inquirer");
const yargs = require('yargs');
const content_type_definitions = require('../importer/content-type-definitions');
const author = require('../importer/author');
const category = require('../importer/category');
const custom = require('../console/console');
const tag = require('../importer/tag');
const post = require('../importer/post');
const page = require('../importer/page');
const media = require('../importer/media');
const fs = require('fs');
const errors = [];
const stdOut = [];
let errorObject = {errorCode: 0};
const oldConsole = console;

const start = (apiKey, wordpressUrl, isJson = false) => {
    console = custom.console(oldConsole, isJson, errors, stdOut, errorObject, fs);

    if (wordpressUrl.charAt(wordpressUrl.length - 1) !== '/') {
        wordpressUrl += '/';
    }
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

yargs
    .boolean('json-output')
    .alias('json-output', ['j'])
    .describe('json-output', ' Whether to return results as JSON')
    .command('import [apiKey] [wordpressUrl]', 'Import wordpress to Flotiq', (yargs) => {
        yargs
            .positional('apiKey', {
                describe: 'Flotiq RW API key',
                type: 'string',
            })
            .positional('wordpressUrl', {
                describe: 'Url to wordpress project',
                type: 'string',
            });
    }, async (argv) => {
        if (yargs.argv._.length < 3) {
            const answers = await askStartQuestions();
            const {apiKey, wordpressUrl} = answers;
            start(apiKey, wordpressUrl, yargs.argv['json-output'])
        } else if (yargs.argv._.length === 3) {
            start(argv.apiKey, argv.wordpressUrl, yargs.argv['json-output'])
        } else {
            yargs.showHelp();
            process.exit(1);
        }
    })

checkCommand(yargs, 0);

function checkCommand(yargs, numRequired) {
    if (yargs.argv._.length <= numRequired) {
        yargs.showHelp();
        process.exit(1);
    }
}

async function askStartQuestions() {
    const questions = [
        {
            name: "apiKey",
            type: "input",
            message: "Flotiq api key:"
        },
        {
            name: "wordpressUrl",
            type: "input",
            message: "Url to wordpress project:"
        },

    ];
    return inquirer.prompt(questions);
}


exports.start = start
