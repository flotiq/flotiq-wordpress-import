import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../src/configuration/config.js';
import contentType1 from '../src/content-type-definitions/contentType1.json' with { type: 'json' };
import contentType2 from '../src/content-type-definitions/contentType2.json' with { type: 'json' };
import contentType3 from '../src/content-type-definitions/contentType3.json' with { type: 'json' };
import contentType4 from '../src/content-type-definitions/contentType4.json' with { type: 'json' };
import contentType5 from '../src/content-type-definitions/contentType5.json' with { type: 'json' };

const definitions = [contentType1, contentType2, contentType3, contentType4, contentType5];

const { createOrUpdateMock, getFlotiqApiMock, notifyMock } = vi.hoisted(() => ({
    createOrUpdateMock: vi.fn(),
    getFlotiqApiMock: vi.fn(),
    notifyMock: vi.fn(),
}));

vi.mock('flotiq-api', () => ({
    default: {
        getFlotiqApi: getFlotiqApiMock,
    },
}));

vi.mock('../src/helpers/notify.js', () => ({
    resultNotify: notifyMock,
}));

describe('content type definitions importer', () => {
    beforeEach(() => {
        vi.resetModules();
        config.apiUrl = 'https://api.flotiq.com';
        createOrUpdateMock.mockReset();
        getFlotiqApiMock.mockReset();
        notifyMock.mockReset();
        createOrUpdateMock.mockResolvedValue({ status: 200, statusText: 'OK', json: async () => ({}) });
        getFlotiqApiMock.mockReturnValue({
            createOrUpdate: createOrUpdateMock,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('posts every bundled content type definition to Flotiq', async () => {
        const { importer } = await import('../src/helpers/content-type-definitions.js');

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
