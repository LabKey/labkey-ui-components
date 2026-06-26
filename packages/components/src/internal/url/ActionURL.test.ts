/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL, __setController } from '@labkey/api';

import { getRedirectUrl } from './ActionURL';
import { AppURL, buildURL } from './AppURL';

// window.location.origin is "http://localhost" in the jsdom test environment.
const safeRedirectUrl = (returnUrl: string): string =>
    ActionURL.buildURL('core', 'safeRedirect', undefined, { returnUrl });

describe('getRedirectUrl', () => {
    beforeEach(() => {
        __setController('samplemanager');
    });

    describe('AppURL', () => {
        test('navigates directly to an in-app AppURL via toHref()', () => {
            const url = AppURL.create('registry', 'molecule');
            expect(url.toHref()).toEqual('#/registry/molecule'); // sanity check: in-app hash path
            expect(getRedirectUrl(url)).toEqual('#/registry/molecule');
        });

        test('navigates directly to a cross-app AppURL via toHref(), never through safeRedirect', () => {
            const url = AppURL.create('registry', 'molecule').setProductId('biologics');
            expect(url.toHref()).not.toMatch(/^#/); // sanity check: full cross-app URL, not a hash path
            expect(getRedirectUrl(url)).toEqual(url.toHref());
            expect(getRedirectUrl(url)).not.toContain('safeRedirect');
        });
    });

    describe('same-origin string -> navigates directly', () => {
        test.each([
            ['relative path', '/labkey/MyContainer/some-action.view?rowId=4'],
            ['relative path with hash', '/labkey/MyContainer/app.view#/samples/123'],
            ['absolute same-origin URL', 'http://localhost/labkey/MyContainer/some-action.view'],
            ['root-relative path', '/home/project-begin.view'],
        ])('%s', (_label, url) => {
            expect(getRedirectUrl(url)).toEqual(url);
        });

        test('a buildURL() result navigates directly', () => {
            // Mirrors SamplesEditButton: a self-built server action URL is same-origin, so it is not wrapped.
            const url = buildURL('publish', 'sampleTypePublishStart.view', { rowId: 4 });
            expect(getRedirectUrl(url)).toEqual(url);
            expect(getRedirectUrl(url)).not.toContain('safeRedirect');
        });
    });

    describe('cross-origin / opaque string -> routes through safeRedirect', () => {
        test.each([
            ['external https URL', 'https://evil.example.com/phish'],
            ['protocol-relative URL', '//evil.example.com/phish'],
            ['userinfo confusion (real host is evil)', 'https://localhost@evil.example.com/phish'],
            ['backslash trickery', 'https:/\\/\\evil.example.com/phish'],
        ])('%s', (_label, url) => {
            const result = getRedirectUrl(url);
            expect(result).toEqual(safeRedirectUrl(url));
            expect(result).toContain('core-safeRedirect.view');
            expect(result).toContain('returnUrl=');
            expect(result).not.toEqual(url);
        });

        test('javascript: URL has an opaque origin and is routed through safeRedirect', () => {
            const url = 'javascript:alert(1)'; // eslint-disable-line no-script-url
            expect(getRedirectUrl(url)).toEqual(safeRedirectUrl(url));
        });

        test('unparseable string is treated as unsafe and routed through safeRedirect', () => {
            const url = 'http://[::::::]:not-a-port';
            expect(getRedirectUrl(url)).toEqual(safeRedirectUrl(url));
        });
    });
});
