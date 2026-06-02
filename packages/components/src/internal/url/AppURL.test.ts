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

    test('fromMenuUrl undefined / invalid', () => {
        expect(AppURL.fromMenuUrl(undefined, 'samplemanager', '/DefaultTestContainer')).toBeUndefined();
        expect(AppURL.fromMenuUrl('/samples/blood', 'samplemanager', '/DefaultTestContainer')).toBeUndefined();
        expect(AppURL.fromMenuUrl('samples/blood', 'samplemanager', '/DefaultTestContainer')).toBeUndefined();
        expect(AppURL.fromMenuUrl('', 'samplemanager', '/DefaultTestContainer')).toBeUndefined();
    });

    test('fromMenuUrl basic path', () => {
        const url = AppURL.fromMenuUrl('#/samples/blood', 'samplemanager', '/DefaultTestContainer');
        expect(url).toBeDefined();
        expect(url.getProductId()).toEqual('samplemanager');
        expect(url.getContainerPath()).toEqual('/DefaultTestContainer');
        // productId and containerPath match the current context, so it should be an app path
        expect(url.isAppPath()).toBeTruthy();
        expect(url.toString()).toEqual('/samples/blood');
        expect(url.toHref()).toEqual('#/samples/blood');
    });

    test('fromMenuUrl with single query param', () => {
        const url = AppURL.fromMenuUrl('#/samples/blood?RowId=4', 'samplemanager', '/DefaultTestContainer');
        expect(url).toBeDefined();
        expect(url.toString()).toEqual('/samples/blood?RowId=4');
        expect(url.toHref()).toEqual('#/samples/blood?RowId=4');
    });

    test('fromMenuUrl with multiple query params', () => {
        const url = AppURL.fromMenuUrl(
            '#/samples/blood?foo=bar&baz=qux',
            'samplemanager',
            '/DefaultTestContainer'
        );
        expect(url).toBeDefined();
        const actual = url.toString();
        expect(actual.startsWith('/samples/blood?')).toBeTruthy();
        expect(actual).toContain('foo=bar');
        expect(actual).toContain('baz=qux');
    });

    test('fromMenuUrl with repeated query param key', () => {
        const url = AppURL.fromMenuUrl(
            '#/samples?tag=a&tag=b',
            'samplemanager',
            '/DefaultTestContainer'
        );
        expect(url).toBeDefined();
        // Repeated keys should be preserved as an array of values
        expect(url.toString()).toEqual('/samples?tag=a&tag=b');
    });

    test('fromMenuUrl with different productId', () => {
        // productId differs from current controller, so the URL is rendered as a full URL
        const url = AppURL.fromMenuUrl('#/dashboard', 'biologics', '/DefaultTestContainer');
        expect(url).toBeDefined();
        expect(url.getProductId()).toEqual('biologics');
        expect(url.isAppPath()).not.toBeTruthy();
        expect(url.toString()).toEqual('/labkey/DefaultTestContainer/biologics-app.view#/dashboard');
    });

    test('fromMenuUrl with different containerPath', () => {
        // containerPath differs from the current container, so the URL is rendered as a full URL
        const url = AppURL.fromMenuUrl(
            '#/samples/blood',
            'samplemanager',
            '/DefaultTestContainer/ChildFolder'
        );
        expect(url).toBeDefined();
        expect(url.getContainerPath()).toEqual('/DefaultTestContainer/ChildFolder');
        expect(url.isAppPath()).not.toBeTruthy();
        expect(url.toString()).toEqual(
            '/labkey/DefaultTestContainer/ChildFolder/samplemanager-app.view#/samples/blood'
        );
    });

    test('fromMenuUrl with hash-only url', () => {
        const url = AppURL.fromMenuUrl('#', 'samplemanager', '/DefaultTestContainer');
        expect(url).toBeDefined();
        expect(url.toString()).toEqual('');
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
