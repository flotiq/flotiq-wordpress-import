import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { startImportWordpressMock, startImportWordpressComMock } = vi.hoisted(() => ({
    startImportWordpressMock: vi.fn(),
    startImportWordpressComMock: vi.fn(),
}));

vi.mock('../src/platforms/wordpress/import.js', () => ({
    default: startImportWordpressMock,
}));

vi.mock('../src/platforms/wordpress.com/import.js', () => ({
    default: startImportWordpressComMock,
}));

describe('command integration', () => {
    let originalArgv;

    beforeEach(() => {
        originalArgv = [...process.argv];
        vi.resetModules();
        startImportWordpressMock.mockReset();
        startImportWordpressComMock.mockReset();
    });

    afterEach(() => {
        process.argv = originalArgv;
        vi.clearAllMocks();
    });

    it('executes "import apiKey wordpressUrl" using wordpress importer', async () => {
        process.argv = [
            'node',
            'flotiq-wordpress-import',
            'import',
            'test-api-key',
            'https://example.test/blog',
        ];

        await import('../src/command/command.js');

        await vi.waitFor(() => {
            expect(startImportWordpressMock).toHaveBeenCalledTimes(1);
        });

        expect(startImportWordpressMock).toHaveBeenCalledWith(
            'test-api-key',
            'https://example.test/blog/',
            false,
        );
        expect(startImportWordpressComMock).not.toHaveBeenCalled();
    });

});
