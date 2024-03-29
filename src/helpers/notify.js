
exports.resultNotify = (response, context, name) => {
    if(context !== 'Media') {
        if (response.status === 400) {
            console.log(response.json().then((data) => {
                if(data.errors && data.errors[0]) {
                    console.errorCode(101);
                    console.error(data.errors[0].errors);
                } else {
                    console.log(data);
                }
            }));
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
