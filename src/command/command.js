#!/usr/bin/env node

import inquirer from 'inquirer';
import yargs from 'yargs';
import startImportWordpressCom from '../platforms/wordpress.com/import.js';
import startImportWordpress from '../platforms/wordpress/import.js';

const run = (apiKey, wordpressUrl) => {
    if (wordpressUrl.charAt(wordpressUrl.length - 1) !== '/') {
        wordpressUrl += '/';
    }

    const startImport = getPlatform(wordpressUrl) === 'wordpress.com'
        ? startImportWordpressCom
        : startImportWordpress;

    startImport(apiKey, wordpressUrl)
}
yargs
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
            run(apiKey, wordpressUrl)
        } else if (yargs.argv._.length === 3) {
            run(argv.apiKey, argv.wordpressUrl)
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

export { run };
