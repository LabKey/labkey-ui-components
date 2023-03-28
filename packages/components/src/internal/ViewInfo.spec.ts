import { fromJS, List } from 'immutable';

import { QueryInfo } from '../public/QueryInfo';
import { QueryColumn } from '../public/QueryColumn';

import { ViewInfo } from './ViewInfo';

describe('ViewInfo', () => {
    test('create', () => {
        let view = new ViewInfo({ name: 'test', label: 'Testing' });
        expect(view.name).toBe('test');
        expect(view.label).toBe('Testing');

        view = new ViewInfo({ name: 'test', label: 'Testing', default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');

        view = new ViewInfo({ default: true });
        expect(view.name).toBe(ViewInfo.DEFAULT_NAME);
        expect(view.label).toBe('Default');
    });

    test('serialize', () => {
        let view = new ViewInfo({ name: 'test' });
        expect(ViewInfo.serialize(view).name).toBe('test');
        view = new ViewInfo({ name: ViewInfo.DEFAULT_NAME });
        expect(ViewInfo.serialize(view).name).toBe('');

        const filterObj = { fieldKey: 'test', value: 'val', op: 'contains' };
        view = new ViewInfo({ filter: [filterObj] });
        expect((ViewInfo.serialize(view) as any).filters).toBe(undefined);
        expect(ViewInfo.serialize(view).filter).toStrictEqual([filterObj]);

        const sortObj = { fieldKey: 'test', dir: '+' };
        view = new ViewInfo({ sort: [sortObj] });
        expect((ViewInfo.serialize(view) as any).sorts).toBe(undefined);
        expect(ViewInfo.serialize(view).sort).toStrictEqual([sortObj]);
    });

    test('isVisible', () => {
        let view = new ViewInfo({ default: false, hidden: false, name: 'test' });
        expect(view.isVisible).toBeTruthy();
        view = new ViewInfo({ default: true, hidden: false, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = new ViewInfo({ default: false, hidden: true, name: 'test' });
        expect(view.isVisible).toBeFalsy();
        view = new ViewInfo({ default: false, hidden: false, name: '~~DETAILS~~' });
        expect(view.isVisible).toBeFalsy();
        view = new ViewInfo({ default: false, hidden: false, name: ViewInfo.BIO_DETAIL_NAME });
        expect(view.isVisible).toBeFalsy();
    });

    test('isSaved', () => {
        expect(new ViewInfo({}).isSaved).toBeFalsy();
        expect(new ViewInfo({ saved: undefined }).isSaved).toBeFalsy();
        expect(new ViewInfo({ saved: false }).isSaved).toBeFalsy();
        expect(new ViewInfo({ saved: true }).isSaved).toBeTruthy();
    });

    test('isSystemView', () => {
        expect(new ViewInfo({}).isSystemView).toBeTruthy();
        expect(new ViewInfo({ name: '' }).isSystemView).toBeTruthy();
        expect(new ViewInfo({ name: 'testing' }).isSystemView).toBeFalsy();
        expect(new ViewInfo({ name: ViewInfo.BIO_DETAIL_NAME }).isSystemView).toBeFalsy();
        expect(new ViewInfo({ name: ViewInfo.DEFAULT_NAME }).isSystemView).toBeTruthy();
        expect(new ViewInfo({ name: ViewInfo.DETAIL_NAME }).isSystemView).toBeTruthy();
        expect(new ViewInfo({ name: ViewInfo.UPDATE_NAME }).isSystemView).toBeTruthy();
    });

    test('modifiers', () => {
        let view = new ViewInfo({ session: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = new ViewInfo({ session: true, shared: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = new ViewInfo({ session: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = new ViewInfo({ session: true, shared: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['edited']);
        view = new ViewInfo({ shared: true });
        expect(view.modifiers).toStrictEqual(['shared']);

        view = new ViewInfo({ inherit: true });
        expect(view.modifiers).toStrictEqual(['inherited']);
        view = new ViewInfo({ shared: true, inherit: true });
        expect(view.modifiers).toStrictEqual(['inherited', 'shared']);
    });

    test('addSystemViewColumns, default view', () => {
        let view = new ViewInfo({
            default: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = QueryInfo.create({
            columns: fromJS({
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
        let view = new ViewInfo({
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
        const queryInfo = QueryInfo.create({
            columns: fromJS({
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
        let view = new ViewInfo({
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
        const queryInfo = QueryInfo.create({
            columns: fromJS({
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
        let view = new ViewInfo({
            default: true,
            columns: [
                {
                    fieldKey: 'col1',
                    key: 'col1',
                    name: 'Column 1',
                },
            ],
        });
        const queryInfo = QueryInfo.create({
            columns: fromJS({
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
            disabledSystemFields: ['Other'],
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
