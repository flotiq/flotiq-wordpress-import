const config = require('../configuration/config');
const FlotiqApi = require('flotiq-api');
const notify = require('../helpers/notify');

const { getFlotiqApi } = FlotiqApi;

exports.importer = async (apiKey) => {
    console.log('Importing content type definitions to Flotiq');
    const client = getFlotiqApi(config.getApiBaseUrl(), apiKey);

    let contentDefinitions = [
        require('../content-type-definitions/contentType1.json'),
        require('../content-type-definitions/contentType2.json'),
        require('../content-type-definitions/contentType3.json'),
        require('../content-type-definitions/contentType4.json'),
        require('../content-type-definitions/contentType5.json'),
    ]

    await Promise.all(contentDefinitions.map(async function (contentDefinition) {
        await importContentTypedDefinitions(contentDefinition);
    }));

    async function importContentTypedDefinitions(contentDefinition) {
        let result = await client.createOrUpdate(null, structuredClone(contentDefinition));
        notify.resultNotify(result, 'Definition', contentDefinition.name);
        return contentDefinition.name;
    }
}
