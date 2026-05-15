
exports.resultNotify = (response, context, name, parsedData = null) => {
    console.log(response);
    if(context !== 'Media') {
        if (response.status === 400) {
            const errorData = parsedData || response;
            if(errorData.errors && errorData.errors[0]) {
                console.errorCode(101);
                console.error(errorData.errors[0].errors);
            } else {
                console.log(errorData);
            }
            console.log(context + ' ' + name + ' has not been added.');
        } else if (response.status === 200) {
            console.log(context + ' ' + name + ' added');
        } else {
            console.errorCode(302);
            console.error(context + ' ' + name + ' has not been added: ' + response.statusText + ' (' + response.status + ')');
        }
    } else {
        if (response && response.id) {
            console.log(context + ': ' + name + ' added/existing');
        } else {
            console.errorCode(301);
            console.error(context + ': ' + name + ' has not been added');
        }
    }
}
