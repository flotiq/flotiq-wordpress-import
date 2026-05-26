import * as connect from './../helpers/connect.js';
import {getFlotiqApi} from "@flotiq/api";
import logger from "@flotiq/api/src/logger.js";
import config from "../../../configuration/config.js";
import {isQuotaError} from "../../../helpers/quota-helper.js";

const uploadMediaWithRetry = async (client, mediaConverted, images) => {
    if (images[mediaConverted.fileName]) {
        return images[mediaConverted.fileName];
    }
    return await client.uploadMediaFromUrl(mediaConverted, images);
};

export const importer = async (apiKey, wordpressUrl) => {
    logger.info('# Importing media to Flotiq');
    const flotiqClient = getFlotiqApi(config.getApiBaseUrl(), apiKey);
    let perPage = 100;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;
    let mediaArray = {};
    let quotaExceeded = false;
    let images = await fetchFlotiqMedia(flotiqClient);
    images = convertImages(images);

    for (page; page <= totalPages && !quotaExceeded; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'media');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;
        let responseJson = wordpressResponse.responseJson;

        // Upload media sequentially instead of in parallel to allow stopping on quota exceeded
        for (let media of responseJson) {
            if (quotaExceeded) break;

            let mediaConverted = convert(media);
            try {
                let result = await uploadMediaWithRetry(flotiqClient, mediaConverted, images);
                logger.info(`Media ${mediaConverted.fileName} added/existing`);
                imported++;
                if (result) {
                    mediaArray[media.id] = result.data ? result.data[0] : result;
                    mediaArray[media.id].sizes = media.media_details && media.media_details.sizes ? media.media_details.sizes : {size: {source_url: media.guid.rendered}};
                }
            } catch (error) {
                if (isQuotaError(error)) {
                    logger.error('Quota exceeded. Stopping media uploads.');
                    quotaExceeded = true;
                    break;
                } else {
                    logger.error('Error uploading media:' + JSON.stringify(error.response?.data));
                }
            }
        }

        if (quotaExceeded) break;
        logger.info('Media progress: ' + imported + '/' + totalCount);
    }

    return mediaArray;
};

const fetchFlotiqMedia = async (client) => {
    return await client.fetchContentObjects('_media');
};

function convert(media) {
    if (media.media_details && media.media_details.sizes && media.media_details.sizes.full) {
        return {
            fileName: media.media_details.sizes.full.file,
            url: media.media_details.sizes.full.source_url,
            mime_type: media.mime_type
        };
    } else {
        let guid = media.guid.rendered.split('/');
        return {
            fileName: guid[guid.length - 1],
            url: media.guid.rendered,
            mime_type: media.mime_type
        };
    }
}

function convertImages(images) {
    let convertedImages = {};
    images.forEach(image => {
        convertedImages[image.fileName] = image;
    });
    return convertedImages;
}
