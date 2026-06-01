/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, __setController } from '@labkey/api';

import { buildURL, AppURL } from './AppURL';

describe('AppURL', () => {
    let lk;
    beforeEach(() => {
        lk = LABKEY;
        LABKEY = {
            ...LABKEY,
            devMode: true,
            moduleContext: {
                ...LABKEY.moduleContext,
                // Force isSampleManagerEnabled to be true
                samplemanagement: {},
            },
        };
        __setController('samplemanager');
    });

    afterEach(() => {
        LABKEY = lk;
    });

    test('Empty values dev mode', () => {
        expect(AppURL.create().toHref()).toEqual('#');
        expect(() => AppURL.create('')).toThrow('AppURL: Unable to create URL with empty parts. Parts are [].');
        expect(() => AppURL.create('path', undefined)).toThrow(
            'AppURL: Unable to create URL with empty parts. Parts are [path, undefined].'
        );
    });

    test('Expected paths', () => {
        expect(AppURL.create('registry', 'molecule').addParam('RowId', 4).toHref()).toBe('#/registry/molecule?RowId=4');
        expect(AppURL.create('registry', 'vector', 'new').toHref()).toBe('#/registry/vector/new');
    });

    test('addFilters', () => {
        const url = AppURL.create('somePath').toHref();
        expect(
            AppURL.create('somePath')
                .addFilters(Filter.create('Status', 'closed', Filter.Types.NOT_EQUAL))
                .toHref()
        ).toBe(url + '?query.Status~neq=closed');
        expect(
            AppURL.create('somePath')
                .addFilters(
                    Filter.create('Status', 'open', Filter.Types.NOT_EQUAL),
                    Filter.create('RowId', '10;11;12', Filter.Types.IN),
                    Filter.create('Bob', ['a', 20, 30], Filter.Types.IN)
                )
                .toHref()
        ).toBe(url + '?query.Status~neq=open&query.RowId~in=10%3B11%3B12&query.Bob~in=a%3B20%3B30');
    });

    test('addParam', () => {
        const url = AppURL.create('somePath').toHref();
        const expected = url + '?foo=fooval';
        expect(AppURL.create('somePath').addParam('foo', 'fooval').toHref()).toBe(expected);

        // should undefined be an acceptable key?
        expect(AppURL.create('somePath').addParam(undefined, 'undef').toHref()).toBe('#/somePath?undefined=undef');
    });

    test('addParams', () => {
        const actual = AppURL.create('somePath')
            .addParams({
                undef: undefined,
                val: 23,
                booze: 'gin',
                mix: 'tonic',
            })
            .toHref();

        // Check each parameter as order of params is non-deterministic
        expect(actual).not.toContain('undef=undefined');
        expect(actual).toContain('val=23');
        expect(actual).toContain('booze=gin');
        expect(actual).toContain('mix=tonic');
    });

    test('productId', () => {
        let url = AppURL.create('some', 'fun', 'path');

        // without product id set, it should default to the primary app

        // We are currently configured to be in the primary app, so it should give us an app path
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        // If we change to be in a different app, it should give us a URL for the primary app
        __setController('freezermanager');
        expect(url.toString()).toEqual('/labkey/DefaultTestContainer/samplemanager-app.view#/some/fun/path');
        expect(url.isAppPath()).not.toBeTruthy();

        __setController('samplemanager');
        url = url.setProductId('samplemanager');

        // If the product id matches the current product id, then we should only get a app path
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        url = url.setProductId('alternate');

        // Setting the product ID to something other than the primary should give us a full URL
        expect(url.toString()).toEqual('/labkey/DefaultTestContainer/alternate-app.view#/some/fun/path');
        expect(url.isAppPath()).not.toBeTruthy();
    });

    test('containerPath', () => {
        let url = AppURL.create('some', 'fun', 'path');

        // without containerPath set it should give us an app path
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        // with containerPath set to the current container it should give us an app path
        url = url.setContainerPath('/DefaultTestContainer');
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        // with containerPath set to a different path it should give us a full URL
        url = url.setContainerPath('/DefaultTestContainer/ChildFolder');
        expect(url.toString()).toEqual(
            '/labkey/DefaultTestContainer/ChildFolder/samplemanager-app.view#/some/fun/path'
        );
        expect(url.isAppPath()).not.toBeTruthy();
    });
});

describe('buildURL', () => {
    test('controller and action', () => {
        const expected = '/labkey/DefaultTestContainer/controller-action.view?returnUrl=%2F';
        expect(buildURL('controller', 'action')).toBe(expected);
    });
    test('params', () => {
        const expected = '/labkey/DefaultTestContainer/controller-action.view?p1=test1&returnUrl=%2F';
        expect(buildURL('controller', 'action', { p1: 'test1' })).toBe(expected);
    });
    test('returnUrl', () => {
        const expected = '/labkey/DefaultTestContainer/controller-action.view?returnUrl=somewhere';
        expect(buildURL('controller', 'action', {}, { returnUrl: 'somewhere' })).toBe(expected);
    });
});
