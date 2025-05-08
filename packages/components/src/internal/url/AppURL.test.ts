// Note: YES, this code does need to be above imports. Jest hoists mock code above imports, if we don't do this when
// jest hoists the mock code above imports we'll get an error  that CONTEXT_PATH et al are being used before they're
// defined.
const CONTEXT_PATH = '';
let CONTROLLER = 'samplemanager';
let ACTION = 'app.view';
let CONTAINER = '/MyTestContainer';
jest.mock('@labkey/api', () => {
    const api = jest.requireActual('@labkey/api');

    return {
        ...api,
        // getServerContext: () => ({
        //     experimental: {
        //         containerRelativeURL: true,
        //     },
        //     devMode: true,
        //     moduleContext: {
        //         // Force isSampleManagerEnabled to be true
        //         samplemanagement: {},
        //     },
        // }),
        ActionURL: {
            ...api.ActionURL,
            getContextPath: () => CONTEXT_PATH,
            getAction: () => ACTION,
            getController: () => CONTROLLER,
            getContainer: () => CONTAINER,
        },
    };
});

import { Filter } from '@labkey/api';

import {
    buildURL,
    createProductUrl,
    createProductUrlFromParts,
    AppURL,
    createProductUrlFromPartsWithContainer,
} from './AppURL';

describe('AppURL', () => {
    let lk;
    beforeEach(() => {
        lk = LABKEY;
        LABKEY = {
            ...LABKEY,
            devMode: true,
            experimental: {
                ...LABKEY.experimental,
                containerRelativeURL: true,
            },
            moduleContext: {
                ...LABKEY.moduleContext,
                // Force isSampleManagerEnabled to be true
                samplemanagement: {},
            },
        };
        CONTROLLER = 'samplemanager';
        ACTION = 'app.view';
        CONTAINER = '/MyTestContainer';
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
        ).toBe(url + '?query.Status~neq=open&query.RowId~in=10;11;12&query.Bob~in=a;20;30');
    });

    test('addParam', () => {
        const url = AppURL.create('somePath').toHref();
        const expected = url + '?foo=fooval';
        expect(AppURL.create('somePath').addParam('foo', 'fooval').toHref()).toBe(expected);

        // should undefined be an acceptable key?
        expect(AppURL.create('somePath').addParam(undefined, 'undef').toHref()).toBe('#/somePath?undefined=undef');
    });

    test('addParams with includeEmptyParams', () => {
        const actual = AppURL.create('somePath')
            .addParams(
                {
                    undef: undefined,
                    val: 23,
                    booze: 'gin',
                    mix: 'tonic',
                },
                true
            )
            .toHref();

        // Check each parameter as order of params is non-deterministic
        expect(actual).toContain('undef=undefined');
        expect(actual).toContain('val=23');
        expect(actual).toContain('booze=gin');
        expect(actual).toContain('mix=tonic');
    });

    test('addParams without includeEmptyParams', () => {
        const actual = AppURL.create('somePath')
            .addParams(
                {
                    undef: undefined,
                    val: 23,
                    booze: 'gin',
                    mix: 'tonic',
                },
                false
            )
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
        CONTROLLER = 'freezermanager';
        expect(url.toString()).toEqual('/labkey/DefaultTestContainer/samplemanager-app.view#/some/fun/path');
        expect(url.isAppPath()).not.toBeTruthy();

        CONTROLLER = 'samplemanager';

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

        // without containerPath set, it should give us an app path
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        // with containerPath set to the current container, it should give us an app path
        url = url.setContainerPath('/MyTestContainer');
        expect(url.toString()).toEqual('/some/fun/path');
        expect(url.isAppPath()).toBeTruthy();

        url = url.setContainerPath('/MyTestContainer/ChildFolder');
        expect(url.toString()).toEqual('/labkey/MyTestContainer/ChildFolder/samplemanager-app.view#/some/fun/path');
        expect(url.isAppPath()).not.toBeTruthy();
    });
});

describe('buildURL', () => {
    test('controller and action', () => {
        const expected = '/labkey/controller/DefaultTestContainer/action.view?returnUrl=%2F';
        expect(buildURL('controller', 'action')).toBe(expected);
    });
    test('params', () => {
        const expected = '/labkey/controller/DefaultTestContainer/action.view?p1=test1&returnUrl=%2F';
        expect(buildURL('controller', 'action', { p1: 'test1' })).toBe(expected);
    });
    test('returnUrl', () => {
        const expected = '/labkey/controller/DefaultTestContainer/action.view?returnUrl=somewhere';
        expect(buildURL('controller', 'action', {}, { returnUrl: 'somewhere' })).toBe(expected);
    });
});

describe('createProductUrlFromParts', () => {
    test('no productId', () => {
        const url = createProductUrlFromParts(undefined, 'currentProduct', undefined, 'destination');
        expect(url.toString()).toEqual('/destination');
    });

    test('no currentProductId', () => {
        const url = createProductUrlFromParts('urlProduct', undefined, { rowId: 123 }, 'destination');
        expect(url).toEqual('/labkey/urlproduct/DefaultTestContainer/app.view#/destination?rowId=123');
    });

    test('not currentProductId', () => {
        const url = createProductUrlFromParts('urlProduct', 'currentProduct', { rowId: 123 }, 'destination');
        expect(url).toEqual('/labkey/urlproduct/DefaultTestContainer/app.view#/destination?rowId=123');
    });

    test('is current product', () => {
        const url = createProductUrlFromParts('currentProduct', 'currentProduct', { rowId: 123 }, 'destination');
        expect(url.toString()).toEqual('/destination?rowId=123');
    });

    test('with multiple params', () => {
        const url = createProductUrlFromParts(undefined, 'currentProduct', { rowId: 123, view: 'grid' }, 'destination');
        expect(url.toString()).toEqual('/destination?rowId=123&view=grid');
    });

    test('with multiple parts', () => {
        const url = createProductUrlFromParts(undefined, 'currentProduct', { rowId: 42 }, 'destination', 'mars');
        expect(url.toString()).toEqual('/destination/mars?rowId=42');
    });
});

describe('createProductUrl', () => {
    test('no productId', () => {
        const url = createProductUrl(undefined, 'currentProduct', AppURL.create('destination'));
        expect(url.toString()).toEqual('/destination');
    });

    test('no currentProductId', () => {
        const url = createProductUrl('urlProduct', undefined, AppURL.create('destination').addParam('rowId', 123));
        expect(url).toEqual('/labkey/urlproduct/DefaultTestContainer/app.view#/destination?rowId=123');
    });

    test('not currentProductId', () => {
        const url = createProductUrl(
            'urlProduct',
            'currentProduct',
            AppURL.create('destination').addParam('rowId', 123)
        );
        expect(url).toEqual('/labkey/urlproduct/DefaultTestContainer/app.view#/destination?rowId=123');
    });

    test('is current product', () => {
        const url = createProductUrl(
            'currentProduct',
            'currentProduct',
            AppURL.create('destination').addParam('rowId', 123)
        );
        expect(url.toString()).toEqual('/destination?rowId=123');
    });

    test('with multiple params', () => {
        const url = createProductUrl(
            undefined,
            'currentProduct',
            AppURL.create('destination').addParam('rowId', 123).addParam('view', 'grid')
        );
        expect(url.toString()).toEqual('/destination?rowId=123&view=grid');
    });

    test('with multiple parts', () => {
        const url = createProductUrl(
            undefined,
            'currentProduct',
            AppURL.create('destination', 'mars').addParam('rowId', 42)
        );
        expect(url.toString()).toEqual('/destination/mars?rowId=42');
    });

    test('as url string', () => {
        let url = createProductUrl(undefined, 'currentProduct', '#/destination?rowId=123');
        expect(url.toString()).toEqual('#/destination?rowId=123');

        url = createProductUrl('urlProduct', 'currentProduct', '#/destination?rowId=123');
        expect(url.toString()).toEqual('/labkey/urlproduct/DefaultTestContainer/app.view#/destination?rowId=123');
    });

    test('containerPath', () => {
        expect(createProductUrl('urlProduct', undefined, '#/destination?rowId=123', '/test/container/path')).toBe(
            '/labkey/urlproduct/test/container/path/app.view#/destination?rowId=123'
        );
    });
});

describe('createProductUrlFromPartsWithContainer', () => {
    test('no containerPath, productId match', () => {
        expect((createProductUrlFromPartsWithContainer('a', 'a', undefined, undefined) as AppURL).toHref()).toBe('#');
    });

    test('no containerPath, productId mismatch', () => {
        expect(createProductUrlFromPartsWithContainer('a', 'b', undefined, undefined) as AppURL).toBe(
            '/labkey/a/DefaultTestContainer/app.view#'
        );
    });

    test('containerPath, productId match', () => {
        expect(createProductUrlFromPartsWithContainer('a', 'a', '/test/path', undefined)).toBe(
            '/labkey/a/test/path/app.view#'
        );
    });

    test('containerPath, productId mismatch', () => {
        expect(createProductUrlFromPartsWithContainer('a', 'b', '/test/path', undefined)).toBe(
            '/labkey/a/test/path/app.view#'
        );
    });
});
