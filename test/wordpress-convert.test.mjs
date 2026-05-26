import { beforeEach, describe, expect, it } from 'vitest';
import config from '../src/configuration/config.js';
import * as convert from '../src/platforms/wordpress/helpers/convert.js';

describe('wordpress convert helpers', () => {
    beforeEach(() => {
        config.apiUrl = 'https://api.flotiq.com';
    });

    it('reindexes media objects by file name', () => {
        const mediaArray = [
            { fileName: 'hero-image', id: 'media-1' },
            { fileName: 'inline-image', id: 'media-2' },
        ];

        expect(convert.convertMediaArray(mediaArray)).toEqual({
            'hero-image': mediaArray[0],
            'inline-image': mediaArray[1],
        });
    });

    it('replaces each wordpress media size URL with a Flotiq image URL', () => {
        config.apiUrl = 'https://example.flotiq.test';
        const content = [
            '<p><img src="https://wordpress.test/uploads/photo-150x150.jpg"></p>',
            '<p><img src="https://wordpress.test/uploads/photo.jpg"></p>',
        ].join('');
        const mediaArray = [
            {
                fileName: 'photo',
                id: 'media-123',
                extension: 'jpg',
                sizes: {
                    thumbnail: {
                        source_url: 'https://wordpress.test/uploads/photo-150x150.jpg',
                    },
                    full: {
                        source_url: 'https://wordpress.test/uploads/photo.jpg',
                    },
                },
            },
        ];

        expect(convert.convertContent(content, mediaArray)).toBe([
            '<p><img src="https://example.flotiq.test/image/0x0/media-123.jpg"></p>',
            '<p><img src="https://example.flotiq.test/image/0x0/media-123.jpg"></p>',
        ].join(''));
    });
});
