import logger from '@flotiq/api/src/logger.js';

export const wordpress = async (wordpressUrl, perPage, page, totalPages, type) => {
    const site = wordpressUrl.replace('https://', '');
    let url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/${type}?number=${perPage}&page=${page}&order_by=ID`
    url = url.replace("com//", 'com/');

    logger.info('Fetching ' + url);
    try {
        let response = await fetch(url, {
            method: 'GET'
        });
        let responseJson = await response.json();
        let totalCount = responseJson.found;
        totalPages = Math.ceil(totalCount / perPage);

        return {totalCount: totalCount, totalPages: totalPages, responseJson: responseJson[type]}
    } catch (e) {
        logger.error(`Error fetching from Wordpress URL: ${wordpressUrl}, code: ${e.code}, message: ${e.message}`);
        logger.error('Skipped: ' + wordpressUrl, perPage, page, totalPages, type)
    }
};




