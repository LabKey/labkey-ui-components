/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import { getRedirectUrl } from './ActionURL';
import { AppURL } from './AppURL';

describe('getRedirectUrl', () => {
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

    describe('string', () => {
        test('same-origin string is returned unchanged', () => {
            expect(getRedirectUrl('/labkey/home/project-begin.view')).toEqual('/labkey/home/project-begin.view');
        });

        test('off-origin string routes through safeRedirect', () => {
            expect(getRedirectUrl('https://evil.example.com/phish')).toContain('core-safeRedirect.view');
        });
    });
});
