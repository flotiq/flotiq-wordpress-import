const notify = require('../../../helpers/notify');
const connect = require('./../helpers/connect');
const {flotiqMedia, flotiqMediaUpload} = require('../../../helpers/flotiq');

exports.importer = async (apiKey, wordpressUrl) => {
    console.log('Importing media to Flotiq');
    let perPage = 100;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;
    let mediaArray = {};
    let quotaExceeded = false;
    let images = await flotiqMedia(apiKey);
    images = convertImages(images);

    for(page; page <= totalPages && !quotaExceeded; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'media');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;
        let responseJson = wordpressResponse.responseJson;
        
        // Upload media sequentially instead of in parallel to allow stopping on quota exceeded
        for (let media of responseJson) {
            if (quotaExceeded) break;
            
            let mediaConverted = convert(media);
            try {
                let result = await flotiqMediaUpload(apiKey, 'media', mediaConverted, images);
                notify.resultNotify(result, 'Media', mediaConverted.fileName);
                imported++;
                if(result) {
                    mediaArray[media.id] = result.data ? result.data[0] : result;
                    mediaArray[media.id].sizes = media.media_details && media.media_details.sizes ? media.media_details.sizes : {size: {source_url: media.guid.rendered}};
                }
            } catch (error) {
                // Check for quota exceeded error (403 status or quota_exceeded in error message/data)
                const isQuotaExceeded = 
                    error.response?.status === 403 ||
                    error.response?.data?.error?.includes('quota') ||
                    error.response?.data?.message?.includes('quota') ||
                    error.message?.includes('quota') ||
                    JSON.stringify(error).includes('quota');
                
                if (isQuotaExceeded) {
                    console.error('Quota exceeded. Stopping media uploads.');
                    quotaExceeded = true;
                    break;
                } else {
                    console.error('Error uploading media:', error);
                }
            }
        }
        
        if (quotaExceeded) break;
        console.log('Media progress: ' + imported + '/' + totalCount);
    }

    function convert(media) {
        if(media.media_details && media.media_details.sizes && media.media_details.sizes.full) {
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

    return mediaArray;
};
