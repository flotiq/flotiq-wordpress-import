const errorTextColor = '\x1b[31m%s\x1b[0m';
const fs = require('fs');

let console = ((oldConsole, isJson, errors, stdOut, errorObject) => {

    process.on('exit', () => {
        if (isJson) {
            {
                const json = {
                    errorCode: errorObject.code,
                    errors: errors,
                    stdOut: stdOut
                }
                fs.writeFileSync('./output.json', JSON.stringify(json));
            }
        }
    })

    return {
        log: (colorOrText, text = '') => {
            oldConsole.log(colorOrText, text || '');
            if (isJson) stdOut.push(removeColorsAndBrakeLines(text || colorOrText));
        },
        info: (colorOrText, text = '') => {
            oldConsole.info(colorOrText, text);
            if (isJson) stdOut.push(removeColorsAndBrakeLines(text || colorOrText));

        },
        warn: (colorOrText, text = '') => {
            oldConsole.warn(colorOrText, text);
            if (isJson) stdOut.push(removeColorsAndBrakeLines(text || colorOrText));

        },
        error: (colorOrText, text = '') => {
            oldConsole.error(colorOrText, text)
            if (isJson) {
                errors.push(removeColorsAndBrakeLines(text || colorOrText));
            }
        },
        errorCode: (code) => {
            errorObject.code = code;
            oldConsole.log(errorTextColor, `Error code: ${code}`)
        }
    }
});


const removeColorsAndBrakeLines = (data) => {
    let returnData = data;
    if (typeof data === typeof '') {
        const textWithoutColors = data.replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        returnData = textWithoutColors;

    }
    return returnData;
}
module.exports = {
    console
}
