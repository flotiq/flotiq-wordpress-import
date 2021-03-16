const fetch = require('node-fetch');

exports.wordpress = async (wordpressUrl, perPage, page, totalPages, type) => {
    console.log('Fetching ' + wordpressUrl + '?rest_route=/wp/v2/' + type + '&per_page=' + perPage + '&page=' + page + '&orderby=id');
    try {
        let response = await fetch(wordpressUrl + '?rest_route=/wp/v2/' + type + '&per_page=' + perPage + '&page=' + page + '&orderby=id', {
            method: 'GET'
        });

        let totalCount = response.headers.get('X-WP-Total');
        totalPages = response.headers.get('X-WP-TotalPages');
        let responseJson = await response.json();
        return {totalCount: totalCount, totalPages: totalPages, responseJson: responseJson}
    } catch (e) {
        console.errorCode(400);
        console.error('Incorrect Wordpress Url');
        process.exit(1);
    }
}