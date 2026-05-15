let settings = {
    apiUrl: 'https://api.flotiq.com'
}

const getApiBaseUrl = () => settings.apiUrl.replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/, '') + '/api/v1';

module.exports = settings;
module.exports.getApiBaseUrl = getApiBaseUrl;
