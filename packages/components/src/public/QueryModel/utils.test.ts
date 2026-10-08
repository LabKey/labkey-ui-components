import { ViewInfo } from '../../internal/ViewInfo';
import { QueryInfo } from '../QueryInfo';
import { ExtendedMap } from '../ExtendedMap';
import { QueryColumn } from '../QueryColumn';
import { EXPORT_TYPES, ExportHeaderTypes } from '../../internal/constants';
import { SchemaQuery } from '../SchemaQuery';
import { addSystemViewColumns, getQueryModelExportParams } from './utils';
import { makeTestQueryModel } from './testUtils';

describe('addSystemViewColumns', () => {
    test('default view', () => {
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
        view = addSystemViewColumns(view, queryInfo);
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

    test('default session view', () => {
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
        view = addSystemViewColumns(view, queryInfo);
        // if it's a session view, no additional columns should be added
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
        ]);
    });

    test('not default view', () => {
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
        view = addSystemViewColumns(view, queryInfo);
        // if it's not the default view, no additional columns shoulb be added
        expect(view.columns).toStrictEqual([
            {
                fieldKey: 'col1',
                key: 'col1',
                name: 'Column 1',
            },
        ]);
    });

    test('default view, with disabledSysFields', () => {
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
        view = addSystemViewColumns(view, queryInfo);
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

describe('getQueryModelExportParams', () => {
    const queryInfo = QueryInfo.fromJsonForTests(
        {
            schemaName: 'samples',
            name: 'Blood',
            columns: {
                name: { fieldKey: 'Name', name: 'Name', caption: 'Name' },
                storedAmount: { fieldKey: 'StoredAmount', name: 'StoredAmount', caption: 'Stored Amount' },
                sampleState: { fieldKey: 'SampleState', name: 'SampleState', caption: 'Status' },
            },
            views: [
                {
                    name: ViewInfo.DEFAULT_NAME,
                    default: true,
                    columns: [
                        { fieldKey: 'Name' },
                        { fieldKey: 'StoredAmount', title: 'Quantity' },
                        { fieldKey: 'SampleState', title: 'Status' },
                    ],
                },
            ],
        },
        true
    );
    const model = makeTestQueryModel(new SchemaQuery('samples', 'Blood'), queryInfo);

    test('custom view label replaces export alias for Caption header', () => {
        const params = getQueryModelExportParams(model, EXPORT_TYPES.CSV, {
            'exportAlias.name': 'Sample ID',
            'exportAlias.storedAmount': 'Amount',
            'exportAlias.sampleState': 'Sample Status',
            headerType: ExportHeaderTypes.Caption,
            includeColumn: ['Folder'],
        });

        expect(params['exportAlias.storedAmount']).toBeUndefined();
        expect(params['exportAlias.name']).toBe('Sample ID');
        // view title matches the column caption, so it is not a custom label
        expect(params['exportAlias.sampleState']).toBe('Sample Status');
        expect(params.includeColumn).toEqual(['Folder']);
    });

    test('custom view label replaces export alias', () => {
        const params = getQueryModelExportParams(model, EXPORT_TYPES.CSV, {
            'exportAlias.name': 'Sample ID',
            'exportAlias.storedAmount': 'Amount',
            'exportAlias.sampleState': 'Sample Status',
            headerType: ExportHeaderTypes.ImportField,
            includeColumn: ['Folder'],
        });

        expect(params['exportAlias.storedAmount']).toBe('Amount');
        expect(params['exportAlias.name']).toBe('Sample ID');
        // view title matches the column caption, so it is not a custom label
        expect(params['exportAlias.sampleState']).toBe('Sample Status');
        expect(params.includeColumn).toEqual(['Folder']);
    });
});
