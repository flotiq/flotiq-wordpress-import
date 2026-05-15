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

const createOrUpdateMock = vi.fn();
const getFlotiqApiMock = vi.fn();
const notifyMock = vi.fn();
const flotiqApiModulePath = require.resolve('flotiq-api');
const notifyModulePath = require.resolve('../src/helpers/notify');

const originalFlotiqApiModule = require.cache[flotiqApiModulePath];
const originalNotifyModule = require.cache[notifyModulePath];

describe('content type definitions importer', () => {
    beforeEach(() => {
        config.apiUrl = 'https://api.flotiq.com';
        createOrUpdateMock.mockReset();
        getFlotiqApiMock.mockReset();
        notifyMock.mockReset();
        createOrUpdateMock.mockResolvedValue({ status: 200, statusText: 'OK', json: async () => ({}) });
        getFlotiqApiMock.mockReturnValue({
            createOrUpdate: createOrUpdateMock,
        });
        require.cache[flotiqApiModulePath] = {
            id: flotiqApiModulePath,
            filename: flotiqApiModulePath,
            loaded: true,
            exports: {
                getFlotiqApi: getFlotiqApiMock,
            },
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
        if (originalFlotiqApiModule) {
            require.cache[flotiqApiModulePath] = originalFlotiqApiModule;
        } else {
            delete require.cache[flotiqApiModulePath];
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

        expect(getFlotiqApiMock).toHaveBeenCalledWith('https://api.flotiq.com/api/v1', 'test-api-key');
        expect(createOrUpdateMock).toHaveBeenCalledTimes(definitions.length);
        expect(createOrUpdateMock).toHaveBeenNthCalledWith(
            1,
            null,
            definitions[0],
        );
        expect(notifyMock).toHaveBeenCalledTimes(definitions.length);
        expect(notifyMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ status: 200, statusText: 'OK' }),
            'Definition',
            definitions[0].name,
        );
    });
});
