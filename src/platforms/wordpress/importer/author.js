const notify = require('../../../helpers/notify');
const {flotiq} = require('../../../helpers/flotiq');
const connect = require('../helpers/connect');
const authorContentType = require('../../../content-type-definitions/contentType1.json');

exports.importer = async (apiKey, wordpressUrl) => {
    console.log('Importing authors to Flotiq');
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;

    for(page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'users');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let authorsConverted = [];

        if (responseJson.data.status !== 200) {
            responseJson = [{
                id: 1,
                slug: 'unknown_author',
                name: 'Unknown Author',
                description: 'unknown author'
            }];
            console.log("Can't fetch authors! Created default 'unknown' author.")
        }

        responseJson.map(async (author) => {
            authorsConverted.push(convert(author));
        })
        let result = await flotiq(apiKey, authorContentType.name, authorsConverted);
        let json;
        let text;
        try{
            text = await result.text()
            console.log(text);
            json = JSON.parse(text);

        }catch (e) {
            console.log(text);
        }
        if(json && json.batch_success_count && json.errors.length === 0){
            imported+=json.batch_success_count;
        }
        notify.resultNotify(result, 'Authors from page', page);

        console.log('Authors progress: ' + imported + '/' + totalCount);

    }

    function convert(author) {
        return {
            id: authorContentType.name + '_' + author.id,
            slug: author.slug,
            name: author.name,
            description: author.description
        }
    }
}
