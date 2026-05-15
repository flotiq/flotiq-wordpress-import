const fetch = require('node-fetch');

const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // initial delay, exponential backoff

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retryCount = 0) => {
    let timeoutId;
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            timeout: FETCH_TIMEOUT,
        });
        
        clearTimeout(timeoutId);
        return response;
    } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if ((e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.name === 'AbortError') && retryCount < MAX_RETRIES) {
            const delayMs = RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.log(`Connection error (${e.code}), retrying in ${delayMs}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(delayMs);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw e;
    }
};

exports.wordpress = async (wordpressUrl, perPage, page, totalPages, type) => {
    console.log('Fetching ' + wordpressUrl + '?rest_route=/wp/v2/' + type + '&per_page=' + perPage + '&page=' + page + '&orderby=id');
    try {
        let response = await fetchWithRetry(wordpressUrl + '?rest_route=/wp/v2/' + type + '&per_page=' + perPage + '&page=' + page + '&orderby=id', {
            method: 'GET'
        });

        let totalCount = response.headers.get('X-WP-Total');
        let totalPages = response.headers.get('X-WP-TotalPages');
        let responseJson = await response.json();
        return {totalCount: totalCount, totalPages: totalPages, responseJson: responseJson}
    } catch (e) {
        console.error(e);
        console.error('Error fetching from Wordpress URL: ' + wordpressUrl);
        console.error('Skipped: ' + wordpressUrl, perPage, page, totalPages, type)
    }
}
