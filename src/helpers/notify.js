import logger from "@flotiq/api/src/logger.js";

export const resultNotify = (response, context, name, parsedData = null) => {
    if(context !== 'Media') {
        if (response.status === 400) {
            const errorData = parsedData || response;
            if(errorData.errors && errorData.errors[0]) {
                console.errorCode(101);
                console.error(errorData.errors[0].errors);
            }
            logger.info(context + ' ' + name + ' has not been added, existing.');
        } else if (response.status === 200) {
            logger.info(context + ' ' + name + ' added');
        } else {
            console.errorCode(302);
            console.error(context + ' ' + name + ' has not been added: ' + response.statusText + ' (' + response.status + ')');
        }
    } else {
        if (response && response.id) {
            logger.info(context + ': ' + name + ' added/existing');
        } else {
            console.errorCode(301);
            console.error(context + ': ' + name + ' has not been added');
        }
    }
};
