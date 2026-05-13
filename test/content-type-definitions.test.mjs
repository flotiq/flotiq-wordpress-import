import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../src/configuration/config');
const definitions = [
    require('../src/content-type-definitions/contentType1.json'),
    require('../src/content-type-definitions/contentType2.json'),
    require('../src/content-type-definitions/contentType3.json'),
    require('../src/content-type-definitions/contentType4.json'),
    require('../src/content-type-definitions/contentType5.json'),
];

const fetchMock = vi.fn();
const notifyMock = vi.fn();
const fetchModulePath = require.resolve('node-fetch');
const notifyModulePath = require.resolve('../src/helpers/notify');

const originalFetchModule = require.cache[fetchModulePath];
const originalNotifyModule = require.cache[notifyModulePath];

describe('content type definitions importer', () => {
    beforeEach(() => {
        config.apiUrl = 'https://api.flotiq.com';
        fetchMock.mockReset();
        notifyMock.mockReset();
        fetchMock.mockResolvedValue({ status: 200, statusText: 'OK' });
        require.cache[fetchModulePath] = {
            id: fetchModulePath,
            filename: fetchModulePath,
            loaded: true,
            exports: fetchMock,
        };
        require.cache[notifyModulePath] = {
            id: notifyModulePath,
            filename: notifyModulePath,
            loaded: true,
            exports: { resultNotify: notifyMock },
        };
        delete require.cache[require.resolve('../src/helpers/content-type-definitions')];
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (originalFetchModule) {
            require.cache[fetchModulePath] = originalFetchModule;
        } else {
            delete require.cache[fetchModulePath];
        }
        if (originalNotifyModule) {
            require.cache[notifyModulePath] = originalNotifyModule;
        } else {
            delete require.cache[notifyModulePath];
        }
    });

    it('posts every bundled content type definition to Flotiq', async () => {
        const { importer } = require('../src/helpers/content-type-definitions');

        await importer('test-api-key');

        expect(fetchMock).toHaveBeenCalledTimes(definitions.length);
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://api.flotiq.com/api/v1/internal/contenttype',
            {
                method: 'POST',
                body: JSON.stringify(definitions[0]),
                headers: {
                    accept: 'application/json',
                    'X-AUTH-TOKEN': 'test-api-key',
                    'Content-Type': 'application/json',
                },
            },
        );
        expect(notifyMock).toHaveBeenCalledTimes(definitions.length);
        expect(notifyMock).toHaveBeenNthCalledWith(1, { status: 200, statusText: 'OK' }, 'Definition', definitions[0].name);
    });
});
