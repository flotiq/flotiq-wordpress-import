import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../src/configuration/config.js';

const { fetchMock, fetchContentObjectsMock, uploadMediaFromUrlMock, getFlotiqApiMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    fetchContentObjectsMock: vi.fn(),
    uploadMediaFromUrlMock: vi.fn(),
    getFlotiqApiMock: vi.fn(),
}));

vi.mock('flotiq-api', () => ({
    default: {
        getFlotiqApi: getFlotiqApiMock,
    },
}));

describe('flotiq helper', () => {
    beforeEach(() => {
        vi.resetModules();
        config.apiUrl = 'https://api.flotiq.com';
        fetchMock.mockReset();
        fetchContentObjectsMock.mockReset();
        uploadMediaFromUrlMock.mockReset();
        getFlotiqApiMock.mockReset();

        fetchMock.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            json: async () => ({ batch_success_count: 2, errors: [] }),
            text: async () => '{"batch_success_count":2,"errors":[]}',
        });
        fetchContentObjectsMock.mockResolvedValue([{ id: 'media-1' }]);
        uploadMediaFromUrlMock.mockResolvedValue({ id: 'media-2' });
        getFlotiqApiMock.mockReturnValue({
            fetchContentObjects: fetchContentObjectsMock,
            uploadMediaFromUrl: uploadMediaFromUrlMock,
        });
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('wraps batch writes in a fetch-like response', async () => {
        const { flotiq } = await import('../src/helpers/flotiq.js');

        const response = await flotiq('test-api-key', 'posts', [{ id: 'post-1' }]);

        expect(getFlotiqApiMock).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.flotiq.com/api/v1/content/posts/batch?updateExisting=true',
            {
                method: 'POST',
                body: JSON.stringify([{ id: 'post-1' }]),
                headers: {
                    accept: 'application/json',
                    'X-AUTH-TOKEN': 'test-api-key',
                    'Content-Type': 'application/json',
                },
            },
        );
        expect(response.status).toBe(200);
        expect(response.statusText).toBe('OK');
        expect(await response.json()).toEqual({ batch_success_count: 2, errors: [] });
        expect(await response.text()).toBe('{"batch_success_count":2,"errors":[]}');
    });

    it('uses the flotiq client for media reads and uploads', async () => {
        const { flotiqMedia, flotiqMediaUpload } = await import('../src/helpers/flotiq.js');

        const media = await flotiqMedia('test-api-key');
        const uploaded = await flotiqMediaUpload(
            'test-api-key',
            'media',
            {
                fileName: 'logo.png',
                mime_type: 'image/png',
                url: 'https://cdn.example.com/logo.png',
            },
            {},
        );

        expect(getFlotiqApiMock).toHaveBeenCalledWith('https://api.flotiq.com/api/v1', 'test-api-key');
        expect(fetchContentObjectsMock).toHaveBeenCalledWith('_media');
        expect(media).toEqual([{ id: 'media-1' }]);
        expect(uploadMediaFromUrlMock).toHaveBeenCalledWith(
            {
                fileName: 'logo.png',
                mime_type: 'image/png',
                url: 'https://cdn.example.com/logo.png',
            },
            {},
        );
        expect(uploaded).toEqual({ id: 'media-2' });
    });
});