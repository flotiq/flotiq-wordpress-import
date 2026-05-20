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

describe('command integration wordpress.com', () => {
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

    it('executes "import apiKey wordpress.com-url" using wordpress.com importer', async () => {
        process.argv = [
            'node',
            'flotiq-wordpress-import',
            'import',
            'test-api-key',
            'https://example.wordpress.com/blog',
        ];

        await import('../src/command/command.js');

        await vi.waitFor(() => {
            expect(startImportWordpressComMock).toHaveBeenCalledTimes(1);
        });

        expect(startImportWordpressComMock).toHaveBeenCalledWith(
            'test-api-key',
            'https://example.wordpress.com/blog/',
            false,
        );
        expect(startImportWordpressMock).not.toHaveBeenCalled();
    });
});
