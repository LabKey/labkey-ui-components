import React from 'react';
import { shallow } from 'enzyme';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { QueryInfoForm } from './QueryInfoForm';
import { BulkUpdateForm } from './BulkUpdateForm';

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
const QUERY_INFO = QueryInfo.fromJsonForTests({
    name: 'test',
    schemaName: 'schema',
    columns: {
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_UPDATE,
        fileInput: COLUMN_FILE_INPUT,
    },
});

const DEFAULT_PROPS = {
    onComplete: jest.fn,
    onCancel: jest.fn,
    onSubmitForEdit: jest.fn,
    queryInfo: QUERY_INFO,
    viewName: undefined,
    selectedIds: [],
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise.resolve(),
};

describe('BulkUpdateForm', () => {
    // TODO missing test cases for main functionality of component
    describe('columnFilter', () => {
        test('filters without uniqueKeyField', () => {
            // Arrange
            const wrapper = shallow(<BulkUpdateForm {...DEFAULT_PROPS} />);
            const columnFilter = wrapper.find(QueryInfoForm).prop('columnFilter');

            // Act
            const filteredColumns = QUERY_INFO.columns.filter(c => columnFilter(c));

            // Assert
            expect(filteredColumns.size).toEqual(2);
            expect(filteredColumns.get('update')).toEqual(COLUMN_CAN_UPDATE);
            expect(filteredColumns.get('fileinput')).toEqual(COLUMN_FILE_INPUT);
        });

        test('filters with uniqueFieldKey', () => {
            // Arrange
            const wrapper = shallow(<BulkUpdateForm {...DEFAULT_PROPS} uniqueFieldKey="update" />);
            const columnFilter = wrapper.find(QueryInfoForm).prop('columnFilter');

            // Act
            const filteredColumns = QUERY_INFO.columns.filter(c => columnFilter(c));

            // Assert
            expect(filteredColumns.size).toEqual(1);
            expect(filteredColumns.get('fileinput')).toEqual(COLUMN_FILE_INPUT);
        });
    });
});
