import { ExtendedMap } from '../public/ExtendedMap';

import { QueryInfo } from '../public/QueryInfo';
import { QueryColumn } from '../public/QueryColumn';

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
        expect(ViewInfo.fromJson({ name: 'testing' }).isSystemView).toBeFalsy();
        expect(ViewInfo.fromJson({ name: ViewInfo.BIO_DETAIL_NAME }).isSystemView).toBeFalsy();
        expect(ViewInfo.fromJson({ name: ViewInfo.DEFAULT_NAME }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: ViewInfo.DETAIL_NAME }).isSystemView).toBeTruthy();
        expect(ViewInfo.fromJson({ name: ViewInfo.UPDATE_NAME }).isSystemView).toBeTruthy();
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

    test('addSystemViewColumns, default view', () => {
        let view = ViewInfo.fromJson({
            default: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = new QueryInfo({
            columns: new ExtendedMap({
                hideMe: new QueryColumn({
                    name: 'Hide Me',
                    fieldKey: 'hideMe',
                }),
                systemCol1: new QueryColumn({
                    name: 'System Col 1',
                    addToSystemView: true,
                    fieldKey: 'systemCol1',
                }),
                notSystem: new QueryColumn({
                    name: 'Not System',
                    addToSystemView: false,
                    fieldKey: 'notSystem',
                }),
                otherSystemCol: new QueryColumn({
                    name: 'other',
                    addToSystemView: true,
                    fieldKey: 'other',
                    caption: 'Other Column',
                }),
            }),
        });
        view = view.addSystemViewColumns(queryInfo);
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
            {
                name: 'System Col 1',
                fieldKey: 'systemCol1',
                key: 'systemCol1',
                title: 'System Col 1',
            },
            {
                name: 'other',
                fieldKey: 'other',
                key: 'other',
                title: 'Other Column',
            },
        ]);
    });

    test('addSystemViewColumns, default session view', () => {
        let view = ViewInfo.fromJson({
            default: true,
            session: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = new QueryInfo({
            columns: new ExtendedMap({
                hideMe: new QueryColumn({
                    name: 'Hide Me',
                    hidden: true,
                    fieldKey: 'hideMe',
                }),
                systemCol1: new QueryColumn({
                    name: 'System Col 1',
                    addToSystemView: true,
                    fieldKey: 'systemCol1',
                }),
            }),
        });
        view = view.addSystemViewColumns(queryInfo);
        // if it's a session view, no additional columns should be added
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
        ]);
    });

    test('addSystemViewColumns, not default view', () => {
        let view = ViewInfo.fromJson({
            default: false,
            name: 'Not Default',
            session: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = new QueryInfo({
            columns: new ExtendedMap({
                hideMe: new QueryColumn({
                    name: 'Hide Me',
                    hidden: true,
                    fieldKey: 'hideMe',
                }),
                systemCol1: new QueryColumn({
                    name: 'System Col 1',
                    addToSystemView: true,
                    fieldKey: 'systemCol1',
                }),
            }),
        });
        view = view.addSystemViewColumns(queryInfo);
        // if it's not the default view, no additional columns shoulb be added
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
        ]);
    });

    test('addSystemViewColumns, default view, with disabledSysFields', () => {
        let view = ViewInfo.fromJson({
            default: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = new QueryInfo({
            columns: new ExtendedMap({
                hideMe: new QueryColumn({
                    name: 'Hide Me',
                    fieldKey: 'hideMe',
                }),
                systemCol1: new QueryColumn({
                    name: 'System Col 1',
                    addToSystemView: true,
                    fieldKey: 'systemCol1',
                }),
                notSystem: new QueryColumn({
                    name: 'Not System',
                    addToSystemView: false,
                    fieldKey: 'notSystem',
                }),
                otherSystemCol: new QueryColumn({
                    name: 'other',
                    addToSystemView: true,
                    fieldKey: 'other',
                    caption: 'Other Column',
                }),
            }),
            disabledSystemFields: new Set(['Other']),
        });
        view = view.addSystemViewColumns(queryInfo);
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
            {
                name: 'System Col 1',
                fieldKey: 'systemCol1',
                key: 'systemCol1',
                title: 'System Col 1',
            },
        ]);
    });
});
