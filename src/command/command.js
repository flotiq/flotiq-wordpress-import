#!/usr/bin/env node

const inquirer = require("inquirer");
const yargs = require('yargs');

const run = (apiKey, wordpressUrl, isJson = false) => {
    if (wordpressUrl.charAt(wordpressUrl.length - 1) !== '/') {
        wordpressUrl += '/';
    }

    if (getPlatform(wordpressUrl) === 'wordpress.com') {
        const startImport = require('../platforms/wordpress.com/import');
    } else {
        const startImport = require('../platforms/wordpress/import');
    }
    startImport(apiKey, wordpressUrl, isJson)
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
            run(apiKey, wordpressUrl, yargs.argv['json-output'])
        } else if (yargs.argv._.length === 3) {
            run(argv.apiKey, argv.wordpressUrl, yargs.argv['json-output'])
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

function getPlatform(wordpressUrl) {
    if (wordpressUrl.includes('wordpress.com')) {
        return 'wordpress.com';
    }
    return 'wordpress';
}

exports.run = run;
