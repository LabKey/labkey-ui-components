import { AppURL } from '../..';

import { createProductUrlFromParts, createProductUrl } from './utils';

describe('createProductUrlFromParts', () => {
    test('no productId', () => {
        const url = createProductUrlFromParts(undefined, 'currentProduct', undefined, 'destination');
        expect(url.toString()).toEqual('/destination');
    });

    test('no currentProductId', () => {
        const url = createProductUrlFromParts('urlProduct', undefined, { rowId: 123 }, 'destination');
        expect(url).toEqual('/labkey/urlproduct/app.view#/destination?rowId=123');
    });

    test('not currentProductId', () => {
        const url = createProductUrlFromParts('urlProduct', 'currentProduct', { rowId: 123 }, 'destination');
        expect(url).toEqual('/labkey/urlproduct/app.view#/destination?rowId=123');
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
        expect(url).toEqual('/labkey/urlproduct/app.view#/destination?rowId=123');
    });

    test('not currentProductId', () => {
        const url = createProductUrl(
            'urlProduct',
            'currentProduct',
            AppURL.create('destination').addParam('rowId', 123)
        );
        expect(url).toEqual('/labkey/urlproduct/app.view#/destination?rowId=123');
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
        expect(url.toString()).toEqual('/labkey/urlproduct/app.view#/destination?rowId=123');
    });
});
