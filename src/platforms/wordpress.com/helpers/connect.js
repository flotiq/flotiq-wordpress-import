
const fetch = require('node-fetch');


exports.wordpress = async (wordpressUrl, perPage, page, totalPages, type) => {
    const site = wordpressUrl.replace('https://', '');
    let url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/${type}?number=${perPage}&page=${page}&order_by=ID`
    url = url.replace("com//", 'com/');

    console.log('Fetching ' + url);
    try {
        let response = await fetch(url, {
            method: 'GET'
        });
        let responseJson = await response.json();
        let totalCount = responseJson.found;
        totalPages = Math.ceil(totalCount/perPage);

        return {totalCount: totalCount, totalPages: totalPages, responseJson: responseJson[type]}
    } catch (e) {
        console.errorCode(400);
        console.error('Incorrect Wordpress Url');
        console.error('Skipped: ' + wordpressUrl)
    }
}




