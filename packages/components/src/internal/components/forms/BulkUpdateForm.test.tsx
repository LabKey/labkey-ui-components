import React, { act } from 'react';
import { render } from '@testing-library/react';
import { fromJS, } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { BulkUpdateForm } from './BulkUpdateForm';
import { createMockSelectRowsDeprecatedResponse } from '../../../test/MockUtils';
import { selectRowsDeprecated } from '../../query/api';

const COLUMN_CAN_UPDATE = new QueryColumn({
    fieldKey: 'update',
    name: 'update',
    caption: 'update',
    fieldKeyArray: ['update'],
    shownInUpdateView: true,
    userEditable: true,
});
const COLUMN_CANNOT_UPDATE = new QueryColumn({
    fieldKey: 'neither',
    name: 'neither',
    caption: 'neither',
    fieldKeyArray: ['neither'],
    shownInUpdateView: false,
    userEditable: true,
});
const COLUMN_FILE_INPUT = new QueryColumn({
    fieldKey: 'fileInput',
    name: 'fileInput',
    caption: 'fileInput',
    fieldKeyArray: ['fileInput'],
    shownInUpdateView: true,
    userEditable: true,
    inputType: 'file',
});
const SCHEMA = 'samples';
const QUERY = 'testST';
const QUERY_INFO = QueryInfo.fromJsonForTests({
    name: QUERY,
    schemaName: SCHEMA,
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

const commonResults = {
    "samples/testst": {
        "127796": {
            "update": {
                "value": "abc"
            },
            "fileInput": {
                "value": "/trunk/build/deploy/files/LKSM/@files/sampletype/test.txt",
                "url": "/LKSM-dan/core-downloadFileLink.view?propertyId=82852",
                "displayValue": "sampletype/test.txt"
            }
        },
        "127797": {
            "update": {
                "value": "abc"
            },
            "fileInput": {
                "value": "/trunk/build/deploy/files/LKSM/@files/sampletype/test.txt",
                "url": "/LKSM-dan/core-downloadFileLink.view?propertyId=82852",
                "displayValue": "sampletype/test.txt"
            }
        }
    }
};

const commonResp = {
    key: QUERY,
    models: commonResults,
    orderedModels: { 'samples/testst': fromJS(['127796', '127797']) },
    queries: { [QUERY]: QueryInfo.fromJsonForTests({}) },
    rowCount: 0,
};

const selectRowsDeprecated_ = selectRowsDeprecated as jest.Mock;

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    selectRowsDeprecated: () => createMockSelectRowsDeprecatedResponse(commonResp),
}));


describe('BulkUpdateForm', () => {
    // TODO missing test cases for main functionality of component
    describe('columnFilter', () => {

        test('filters without uniqueKeyField', async () => {
            let container;
            await act(async () => {
                container = render(<BulkUpdateForm {...DEFAULT_PROPS} />);
            });

            expect(document.querySelectorAll('.query-info-form')).toHaveLength(1);
            expect(document.querySelectorAll('.toggle-group-icon')).toHaveLength(2)
            expect(document.querySelectorAll('input#update')).toHaveLength(1);
            expect(document.querySelector('input#update').getAttribute('value')).toBe('abc');
            expect(document.querySelectorAll('.attachment-card__name')).toHaveLength(1);
            expect(document.querySelector('.attachment-card__name').textContent).toBe('test.txt')
        });

        test('filters with uniqueFieldKey', async () => {
            let container;
            await act(async () => {
                container = render(<BulkUpdateForm {...DEFAULT_PROPS} uniqueFieldKey="update" />);
            });

            expect(document.querySelectorAll('.query-info-form')).toHaveLength(1);
            expect(document.querySelectorAll('.toggle-group-icon')).toHaveLength(1)
            expect(document.querySelectorAll('input#update')).toHaveLength(0);
            expect(document.querySelectorAll('.attachment-card__name')).toHaveLength(1);
        });

    });
});
