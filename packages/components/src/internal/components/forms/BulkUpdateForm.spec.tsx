import React from 'react';
import { mount } from 'enzyme';

import { QueryColumn, QueryInfo, SchemaQuery } from '../../..';

import { BulkUpdateForm } from './BulkUpdateForm';
import { QueryInfoForm } from './QueryInfoForm';

const COLUMN_CAN_UPDATE = new QueryColumn({
    fieldKey: 'update',
    name: 'update',
    fieldKeyArray: ['update'],
    shownInUpdateView: true,
    userEditable: true,
});
const COLUMN_CANNOT_UPDATE = new QueryColumn({
    fieldKey: 'neither',
    name: 'neither',
    fieldKeyArray: ['neither'],
    shownInUpdateView: false,
    userEditable: true,
});
const COLUMN_FILE_INPUT = new QueryColumn({
    fieldKey: 'fileInput',
    name: 'fileInput',
    fieldKeyArray: ['fileInput'],
    shownInUpdateView: true,
    userEditable: true,
    inputType: 'file',
});
const QUERY_INFO = QueryInfo.fromJSON({
    name: 'test',
    schemaName: 'schema',
    columns: {
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_UPDATE,
        fileInput: COLUMN_FILE_INPUT,
    },
});

const DEFAULT_PROPS = {
    canSubmitForEdit: false,
    onComplete: jest.fn,
    onCancel: jest.fn,
    onSubmitForEdit: jest.fn,
    queryInfo: QUERY_INFO,
    selectedIds: [],
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise.resolve(),
};

describe('BulkUpdateForm', () => {
    // TODO missing test cases for main functionality of component

    test('getUpdateQueryInfo without uniqueFieldKey', () => {
        const wrapper = mount(<BulkUpdateForm {...DEFAULT_PROPS} />);
        const queryInfo = wrapper.find(QueryInfoForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(1);
        expect(queryInfo.columns.get('update')).toBe(COLUMN_CAN_UPDATE);
        wrapper.unmount();
    });

    test('getUpdateQueryInfo with uniqueFieldKey', () => {
        const wrapper = mount(<BulkUpdateForm {...DEFAULT_PROPS} uniqueFieldKey="update" />);
        const queryInfo = wrapper.find(QueryInfoForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(0);
        wrapper.unmount();
    });
});
