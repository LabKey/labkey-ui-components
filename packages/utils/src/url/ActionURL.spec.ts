/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';
import { AppURL, buildURL } from './ActionURL'

describe('AppURL', () => {

    test('Empty values', () => {
        expect(AppURL.create().toHref()).toEqual('#');
        expect(() => AppURL.create('')).toThrow('AppURL: Unable to create URL with empty parts. Parts are [].');
        expect(() => AppURL.create('path',undefined)).toThrow('AppURL: Unable to create URL with empty parts. Parts are [path, undefined].');
    });

    test('Expected paths', () => {
        expect(AppURL.create('registry', 'molecule').addParam("RowId", 4).toHref())
            .toBe("#/registry/molecule?RowId=4");
        expect(AppURL.create('registry', 'vector', 'new').toHref())
            .toBe("#/registry/vector/new");
    });

    test('addFilters', () => {
        const url = AppURL.create("somePath").toHref();
        expect(AppURL.create("somePath")
            .addFilters(Filter.create("Status", "closed", Filter.Types.NOT_EQUAL)).toHref())
            .toBe(url + '?query.Status~neq=closed');
        expect(AppURL.create("somePath")
            .addFilters(
                Filter.create("Status", "open", Filter.Types.NOT_EQUAL),
                Filter.create('RowId', "10;11;12", Filter.Types.IN)
            ).toHref())
            .toBe(url + '?query.Status~neq=open&query.RowId~in=10;11;12');
    });

    test('addParam', () => {
        const url = AppURL.create('somePath').toHref();
        const expected = url + '?foo=fooval';
        expect(AppURL.create('somePath')
            .addParam("foo", "fooval").toHref()
        ).toBe(expected);

        // should undefined be an acceptable key?
        expect(AppURL.create("somePath")
            .addParam(undefined, "undef").toHref())
            .toBe("#/somepath?undefined=undef")
    });

    test('addParams', () => {
        const expected = '#/somepath?undef=undefined&val=23&booze=gin&mix=tonic';
        expect(AppURL.create("somePath")
            .addParam("undef", undefined)
            .addParam("val", 23)
            .addParam("booze", "gin")
            .addParam("mix", "tonic").toHref())
            .toBe(expected);
    });

    test('buildURL', () => {
        let expected = 'undefined/controller/action.view?returnUrl=%2F';
        expect(buildURL('controller', 'action')).toBe(expected);

        expected = 'undefined/controller/action.view?p1=test1&returnUrl=%2F';
        expect(buildURL('controller', 'action', {p1: 'test1'})).toBe(expected);

        expected = 'undefined/controller/action.view?returnUrl=somewhere';
        expect(buildURL('controller', 'action', {}, {returnURL: 'somewhere'})).toBe(expected);
    });
});