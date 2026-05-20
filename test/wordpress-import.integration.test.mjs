import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../src/configuration/config.js';
import authorContentType from '../src/content-type-definitions/contentType1.json' with { type: 'json' };
import categoryContentType from '../src/content-type-definitions/contentType3.json' with { type: 'json' };
import postContentType from '../src/content-type-definitions/contentType4.json' with { type: 'json' };
import pageContentType from '../src/content-type-definitions/contentType5.json' with { type: 'json' };

const {
    wordpressMock,
    getFlotiqApiMock,
    createOrUpdateMock,
    persistContentObjectBatchMock,
    fetchContentObjectsMock,
    uploadMediaFromUrlMock,
} = vi.hoisted(() => ({
    wordpressMock: vi.fn(),
    getFlotiqApiMock: vi.fn(),
    createOrUpdateMock: vi.fn(),
    persistContentObjectBatchMock: vi.fn(),
    fetchContentObjectsMock: vi.fn(),
    uploadMediaFromUrlMock: vi.fn(),
}));

vi.mock('../src/platforms/wordpress/helpers/connect.js', () => ({
    wordpress: wordpressMock,
}));

vi.mock('@flotiq/api', () => ({
    getFlotiqApi: getFlotiqApiMock,
}));

vi.mock('@flotiq/api/src/logger.js', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('wordpress import integration', () => {
    let originalConsole;

    beforeEach(() => {
        vi.resetModules();
        config.apiUrl = 'https://api.flotiq.test';
        originalConsole = globalThis.console;

        createOrUpdateMock.mockReset();
        persistContentObjectBatchMock.mockReset();
        fetchContentObjectsMock.mockReset();
        uploadMediaFromUrlMock.mockReset();
        getFlotiqApiMock.mockReset();
        wordpressMock.mockReset();

        createOrUpdateMock.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            json: async () => ({}),
        });
        persistContentObjectBatchMock.mockResolvedValue({ status: 200, statusText: 'OK' });
        fetchContentObjectsMock.mockResolvedValue([]);
        uploadMediaFromUrlMock.mockResolvedValue({
            id: 'media-301',
            fileName: 'hero.jpg',
            extension: 'jpg',
        });

        getFlotiqApiMock.mockReturnValue({
            createOrUpdate: createOrUpdateMock,
            persistContentObjectBatch: persistContentObjectBatchMock,
            fetchContentObjects: fetchContentObjectsMock,
            uploadMediaFromUrl: uploadMediaFromUrlMock,
        });

        wordpressMock.mockImplementation(async (_url, _perPage, _page, _totalPages, type) => {
            const responseByType = {
                users: [
                    {
                        id: 10,
                        slug: 'john-doe',
                        name: 'John Doe',
                        description: 'Demo author',
                    },
                ],
                tags: [
                    {
                        id: 21,
                        slug: 'news',
                        name: 'News',
                        description: 'News tag',
                    },
                ],
                categories: [
                    {
                        id: 31,
                        slug: 'general',
                        name: 'General',
                        description: 'General category',
                        parent: 0,
                    },
                    {
                        id: 32,
                        slug: 'updates',
                        name: 'Updates',
                        description: 'Updates category',
                        parent: 31,
                    },
                ],
                media: [
                    {
                        id: 301,
                        mime_type: 'image/jpeg',
                        guid: {
                            rendered: 'https://example.test/wp-content/uploads/hero.jpg',
                        },
                        media_details: {
                            sizes: {
                                full: {
                                    file: 'hero.jpg',
                                    source_url: 'https://example.test/wp-content/uploads/hero.jpg',
                                },
                                thumbnail: {
                                    source_url: 'https://example.test/wp-content/uploads/hero-150x150.jpg',
                                },
                            },
                        },
                    },
                ],
                posts: [
                    {
                        id: 101,
                        slug: 'hello-world',
                        title: { rendered: 'Hello World' },
                        status: 'publish',
                        type: 'post',
                        date: '2026-01-01T00:00:00',
                        modified: '2026-01-02T00:00:00',
                        content: {
                            rendered: '<p><img src="https://example.test/wp-content/uploads/hero.jpg" /></p>',
                        },
                        excerpt: { rendered: 'Excerpt' },
                        author: 10,
                        featured_media: 301,
                        tags: [21],
                        categories: [31],
                    },
                ],
                pages: [
                    {
                        id: 201,
                        slug: 'about',
                        title: { rendered: 'About' },
                        status: 'publish',
                        date: '2026-01-01T00:00:00',
                        modified: '2026-01-02T00:00:00',
                        content: {
                            rendered: '<p>About page</p>',
                        },
                        author: 10,
                        parent: 0,
                        featured_media: 0,
                    },
                    {
                        id: 202,
                        slug: 'about-team',
                        title: { rendered: 'About Team' },
                        status: 'publish',
                        date: '2026-01-03T00:00:00',
                        modified: '2026-01-04T00:00:00',
                        content: {
                            rendered: '<p>About team page</p>',
                        },
                        author: 10,
                        parent: 201,
                        featured_media: 0,
                    },
                ],
            };

            const responseJson = responseByType[type] || [];
            return {
                totalCount: String(responseJson.length),
                totalPages: 1,
                responseJson,
            };
        });
    });

    afterEach(() => {
        globalThis.console = originalConsole;
        vi.clearAllMocks();
    });

    it('imports wordpress sample data when started with apiKey and host', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const startImportModule = await import('../src/platforms/wordpress/import.js');

        startImportModule.default('test-api-key', 'https://example.test/blog/');

        await vi.waitFor(() => {
            expect(logSpy).toHaveBeenCalledWith('Finished', '');
        });

        const importedTypes = new Set(wordpressMock.mock.calls.map((call) => call[4]));
        expect(importedTypes).toEqual(new Set(['users', 'tags', 'categories', 'media', 'posts', 'pages']));

        const persistedData = new Map();
        for (const [contentTypeName, batch] of persistContentObjectBatchMock.mock.calls) {
            const current = persistedData.get(contentTypeName) || [];
            persistedData.set(contentTypeName, [...current, ...batch]);
        }

        expect(createOrUpdateMock).toHaveBeenCalledTimes(5);
        expect(uploadMediaFromUrlMock).toHaveBeenCalledTimes(1);
        expect(persistedData.get(authorContentType.name).some((item) => item.id === `${authorContentType.name}_10`)).toBe(true);
        expect(persistedData.get(postContentType.name).some((item) => item.id === `${postContentType.name}_101`)).toBe(true);
        expect(persistedData.get(pageContentType.name).some((item) => item.id === `${pageContentType.name}_202`)).toBe(true);
        expect(
            persistedData
                .get(categoryContentType.name)
                .some((item) => item.id === `${categoryContentType.name}_32` && Array.isArray(item.parentCategory) && item.parentCategory.length > 0),
        ).toBe(true);
    });
});
