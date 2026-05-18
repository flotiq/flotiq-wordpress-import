import config from '../configuration/config.js';
import FlotiqApi from 'flotiq-api';

const { getFlotiqApi } = FlotiqApi;

const getClient = (apiKey) => getFlotiqApi(config.getApiBaseUrl(), apiKey);

const wrapResponse = (response) => ({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    text: async () => {
        if (typeof response.data === 'string') {
            return response.data;
        }

        return JSON.stringify(response.data);
    },
    json: async () => response.data,
});

const flotiq  = async (apiKey, contentTypeName, contentObject) => {
    let headers = {
        accept: 'application/json',
    };
    headers['X-AUTH-TOKEN'] = apiKey;

    let method = 'POST';
    let url = config.getApiBaseUrl() + '/content/' + contentTypeName + '/batch?updateExisting=true';

    return await fetch(url, {
        method: method,
        body: JSON.stringify(contentObject),
        headers: {...headers, 'Content-Type': 'application/json'},
    });
}

const flotiqMedia = async (apiKey) => {
    const client = getClient(apiKey);

    return await client.fetchContentObjects('_media');
}

const flotiqMediaUpload = async (apiKey, contentTypeName, contentObject, images, retry = 0) => {
    try {
        const client = getClient(apiKey);

        if (images[contentObject.fileName]) {
            return images[contentObject.fileName];
        }

        return await client.uploadMediaFromUrl(contentObject, images);
    } catch (e) {
        if (retry < 5) {
            return await flotiqMediaUpload(apiKey, contentTypeName, contentObject, images, ++retry);
        }

        throw e;
    }
}

export { flotiqMediaUpload, flotiqMedia, flotiq };
