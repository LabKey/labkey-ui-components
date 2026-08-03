/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ExtendedMap } from '../public/ExtendedMap';

import { QueryInfo } from '../public/QueryInfo';
import { IQueryColumn, QueryColumn } from '../public/QueryColumn';

import { ViewInfo } from './ViewInfo';

describe('ViewInfo', () => {
    test('create', () => {
        let view = ViewInfo.fromJson({ name: 'test', label: 'Testing' });
        expect(view.name).toBe('test');
        expect(view.label).toBe('Testing');

        view = ViewInfo.fromJson({ name: 'test', label: 'Testing', default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');

        view = ViewInfo.fromJson({ default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');
    });

    test('serialize', () => {
        let view = ViewInfo.fromJson({ name: 'test' });
        expect(ViewInfo.serialize(view).name).toBe('test');
        view = ViewInfo.fromJson({ name: ViewInfo.DEFAULT_NAME });
        expect(ViewInfo.serialize(view).name).toBe('');

        const filterObj = { fieldKey: 'test', value: 'val', op: 'contains' };
        view = ViewInfo.fromJson({ filter: [filterObj] });
        expect((ViewInfo.serialize(view) as any).filters).toBe(undefined);
        expect(ViewInfo.serialize(view).filter).toStrictEqual([filterObj]);

        const sortObj = { fieldKey: 'test', dir: '+' };
        view = ViewInfo.fromJson({ sort: [sortObj] });
        expect((ViewInfo.serialize(view) as any).sorts).toBe(undefined);
        expect(ViewInfo.serialize(view).sort).toStrictEqual([sortObj]);

        view = ViewInfo.fromJson({
            columns: [{ name: 'col1', key: 'col1', fieldKey: 'col1' }],
            fields: [{ name: 'col1' } as IQueryColumn],
        });
        expect(ViewInfo.serialize(view).fields).toBeUndefined();
        expect(ViewInfo.serialize(view).columns).toStrictEqual([{ name: 'col1', key: 'col1', fieldKey: 'col1' }]);
    });

    test('isVisible', () => {
        let view = ViewInfo.fromJson({ default: false, hidden: false, name: 'test' });
        expect(view.isVisible).toBeTruthy();
        view = ViewInfo.fromJson({ default: true, hidden: false, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.fromJson({ default: false, hidden: true, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.fromJson({ default: false, hidden: false, name: '~~DETAILS~~' });
        expect(view.isVisible).toBeFalsy();
        view = ViewInfo.fromJson({ default: false, hidden: false, name: ViewInfo.BIO_DETAIL_NAME });
        expect(view.isVisible).toBeFalsy();
    });

    test('isSaved', () => {
        expect(ViewInfo.fromJson({}).isSaved).toBeFalsy();
        expect(ViewInfo.fromJson({ saved: undefined }).isSaved).toBeFalsy();
        expect(ViewInfo.fromJson({ saved: false }).isSaved).toBeFalsy();
        expect(ViewInfo.fromJson({ saved: true }).isSaved).toBeTruthy();
    });

    test('isSystemView', () => {
        expect(ViewInfo.fromJson({}).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: '' }).isSystemView).toBeTruthy();
        // undefined is turned into the default view
        expect(ViewInfo.fromJson({ name: undefined }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: 'testing' }).isSystemView).toBeFalsy();
        expect(ViewInfo.fromJson({ name: ViewInfo.BIO_DETAIL_NAME }).isSystemView).toBeFalsy();
        expect(ViewInfo.fromJson({ name: ViewInfo.DEFAULT_NAME }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: ViewInfo.DETAIL_NAME }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: ViewInfo.UPDATE_NAME }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: '~~SOME THING~~' }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: null }).isSystemView).toBeFalsy();
    });

    test('modifiers', () => {
        let view = ViewInfo.fromJson({ session: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = ViewInfo.fromJson({ session: true, shared: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = ViewInfo.fromJson({ session: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = ViewInfo.fromJson({ session: true, shared: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = ViewInfo.fromJson({ shared: true });
        expect(view.modifiers).toStrictEqual(['shared']);

        view = ViewInfo.fromJson({ inherit: true });
        expect(view.modifiers).toStrictEqual(['inherited']);
        view = ViewInfo.fromJson({ shared: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['inherited', 'shared']);
    });
});
