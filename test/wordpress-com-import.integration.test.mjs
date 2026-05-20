import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../src/configuration/config.js';
import authorContentType from '../src/content-type-definitions/contentType1.json' with { type: 'json' };
import categoryContentType from '../src/content-type-definitions/contentType3.json' with { type: 'json' };
import postContentType from '../src/content-type-definitions/contentType4.json' with { type: 'json' };
import tagContentType from '../src/content-type-definitions/contentType2.json' with { type: 'json' };

const {
    wordpressMock,
    getFlotiqApiMock,
    createOrUpdateMock,
    persistContentObjectBatchMock,
} = vi.hoisted(() => ({
    wordpressMock: vi.fn(),
    getFlotiqApiMock: vi.fn(),
    createOrUpdateMock: vi.fn(),
    persistContentObjectBatchMock: vi.fn(),
}));

vi.mock('../src/platforms/wordpress.com/helpers/connect.js', () => ({
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

describe('wordpress.com import integration', () => {
    let originalConsole;

    beforeEach(() => {
        vi.resetModules();
        config.apiUrl = 'https://api.flotiq.test';
        originalConsole = globalThis.console;

        createOrUpdateMock.mockReset();
        persistContentObjectBatchMock.mockReset();
        getFlotiqApiMock.mockReset();
        wordpressMock.mockReset();

        createOrUpdateMock.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            json: async () => ({}),
        });
        persistContentObjectBatchMock.mockResolvedValue({ status: 200, statusText: 'OK' });

        getFlotiqApiMock.mockReturnValue({
            createOrUpdate: createOrUpdateMock,
            persistContentObjectBatch: persistContentObjectBatchMock,
        });

        wordpressMock.mockImplementation(async (_url, _perPage, _page, _totalPages, type) => {
            const responseByType = {
                tags: [
                    {
                        ID: 21,
                        slug: 'news',
                        name: 'News',
                        description: 'News tag',
                    },
                ],
                categories: [
                    {
                        ID: 31,
                        slug: 'general',
                        name: 'General',
                        description: 'General category',
                        parent: 0,
                    },
                    {
                        ID: 32,
                        slug: 'updates',
                        name: 'Updates',
                        description: 'Updates category',
                        parent: 31,
                    },
                ],
                posts: [
                    {
                        ID: 101,
                        slug: 'hello-world',
                        title: 'Hello World',
                        status: 'publish',
                        type: 'post',
                        date: '2026-01-01T00:00:00',
                        modified: '2026-01-02T00:00:00',
                        content: '<p>WordPress.com post</p>',
                        excerpt: 'Excerpt',
                        author: {
                            ID: 10,
                            login: 'john-doe',
                            name: 'John Doe',
                            first_name: 'John',
                            last_name: 'Doe',
                        },
                        tags: {
                            21: {
                                ID: 21,
                                slug: 'news',
                                name: 'News',
                                description: 'News tag',
                            },
                        },
                        categories: {
                            31: {
                                ID: 31,
                                slug: 'general',
                                name: 'General',
                                description: 'General category',
                            },
                        },
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

    it('imports wordpress.com sample data end-to-end', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const startImportModule = await import('../src/platforms/wordpress.com/import.js');

        startImportModule.default('test-api-key', 'https://example.wordpress.com/blog/');

        await vi.waitFor(() => {
            expect(logSpy).toHaveBeenCalledWith('Finished', '');
        });

        const importedTypes = new Set(wordpressMock.mock.calls.map((call) => call[4]));
        expect(importedTypes).toEqual(new Set(['tags', 'categories', 'posts']));

        const persistedData = new Map();
        for (const [contentTypeName, batch] of persistContentObjectBatchMock.mock.calls) {
            const current = persistedData.get(contentTypeName) || [];
            persistedData.set(contentTypeName, [...current, ...batch]);
        }

        expect(createOrUpdateMock).toHaveBeenCalledTimes(5);
        expect(persistedData.get(tagContentType.name).some((item) => item.id === `${tagContentType.name}_21`)).toBe(true);
        expect(
            persistedData
                .get(categoryContentType.name)
                .some((item) => item.id === `${categoryContentType.name}_32` && Array.isArray(item.parentCategory) && item.parentCategory.length > 0),
        ).toBe(true);
        expect(persistedData.get(authorContentType.name).some((item) => item.id === `${authorContentType.name}_10`)).toBe(true);
        expect(persistedData.get(postContentType.name).some((item) => item.id === `${postContentType.name}_101`)).toBe(true);
    });
});