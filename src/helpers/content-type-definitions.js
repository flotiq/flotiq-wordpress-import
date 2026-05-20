import config from '../configuration/config.js';
import {getFlotiqApi} from '@flotiq/api';
import logger from '@flotiq/api/src/logger.js';
import * as notify from '../helpers/notify.js';
import contentType1 from '../content-type-definitions/contentType1.json' with { type: 'json' };
import contentType2 from '../content-type-definitions/contentType2.json' with { type: 'json' };
import contentType3 from '../content-type-definitions/contentType3.json' with { type: 'json' };
import contentType4 from '../content-type-definitions/contentType4.json' with { type: 'json' };
import contentType5 from '../content-type-definitions/contentType5.json' with { type: 'json' };



export const importer = async (apiKey) => {
    logger.info('# Importing content type definitions to Flotiq');
    const client = getFlotiqApi(config.getApiBaseUrl(), apiKey);

    let contentDefinitions = [
        contentType1,
        contentType2,
        contentType3,
        contentType4,
        contentType5,
    ]

    await Promise.all(contentDefinitions.map(async function (contentDefinition) {
        await importContentTypedDefinitions(contentDefinition);
    }));

    async function importContentTypedDefinitions(contentDefinition) {
        let result = await client.createOrUpdate(null, structuredClone(contentDefinition));
        notify.resultNotify(result, 'Definition', contentDefinition.name);
        return contentDefinition.name;
    }
};
