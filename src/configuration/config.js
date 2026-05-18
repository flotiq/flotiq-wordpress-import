let settings = {
    apiUrl: 'https://api.flotiq.com'
}

const getApiBaseUrl = () => settings.apiUrl.replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/, '') + '/api/v1';

settings.getApiBaseUrl = getApiBaseUrl;

export { getApiBaseUrl };
export default settings;
