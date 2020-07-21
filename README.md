<a href="https://flotiq.com/">
    <img src="https://editor.flotiq.com/fonts/fq-logo.svg" alt="Flotiq logo" title="Flotiq" align="right" height="60" />
</a>

Wordpress to Flotiq Importer
=========================

Command for importing tags, categories, media, posts and pages from Wordpress to Flotiq.

## Setup for usage

`npm install -g flotiq-wordpress-import`

## Setup for development

Clone this repository:

`git clone https://github.com/flotiq/flotiq-wordpress-import.git`

Enter the directory:

`cd flotiq-wordpress-import`

Install dependencies:

`npm install`

Check settings defined in:

`src\configuration\config.js`


## Usage

### Start project

`flotiq-wordpress-import import [flotiqApiKey] [wordpressUrl]`

or in development:

`node bin/flotiq-wordpress-import import [flotiqApiKey] [wordpressUrl]`


### Parameters

`flotiqApiKey` - API key to your Flotiq account, it must be read and write API key (more about Flotiq API keys in [the documentation](https://flotiq.com/docs/API/))

`wordpressUrl` - full link to your Wordpress site

## Collaboration

If you wish to talk with us about this project, feel free to hop on [![Discord Chat](https://img.shields.io/discord/682699728454025410.svg)](https://discord.gg/FwXcHnX)  .
   
If you found a bug, please report it in [issues](https://github.com/flotiq/flotiq-wordpress-import/issues).
