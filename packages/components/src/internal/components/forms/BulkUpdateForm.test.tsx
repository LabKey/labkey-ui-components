import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { GridResponse } from '../editable/models';

import { getTestAPIWrapper } from '../../APIWrapper';

import { BulkUpdateForm, BulkUpdateFormProps } from './BulkUpdateForm';

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

const DEFAULT_PROPS: BulkUpdateFormProps = {
    api: getTestAPIWrapper(jest.fn),
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    onSubmitForEdit: jest.fn(),
    queryInfo: QUERY_INFO,
    viewName: undefined,
    selectedIds: [],
    updateRows: jest.fn(),
};

const mockGridResponse: GridResponse = {
    data: fromJS({
        '127796': {
            update: {
                value: 'abc',
            },
            fileInput: {
                value: '/trunk/build/deploy/files/LKSM/@files/sampletype/test.txt',
                url: '/LKSM-dan/core-downloadFileLink.view?propertyId=82852',
                displayValue: 'sampletype/test.txt',
            },
        },
        '127797': {
            update: {
                value: 'abc',
            },
            fileInput: {
                value: '/trunk/build/deploy/files/LKSM/@files/sampletype/test.txt',
                url: '/LKSM-dan/core-downloadFileLink.view?propertyId=82852',
                displayValue: 'sampletype/test.txt',
            },
        },
    }),
    dataIds: List(['127796', '127797']),
};

jest.mock('../../actions', () => ({
    ...jest.requireActual('../../actions'),
    getSelectedDataDeprecated: jest.fn().mockImplementation(() => mockGridResponse),
}));

describe('BulkUpdateForm', () => {
    // TODO missing test cases for main functionality of component
    describe('columnFilter', () => {
        test('filters without uniqueKeyField', async () => {
            render(<BulkUpdateForm {...DEFAULT_PROPS} />);

            await waitFor(() => {
                expect(document.querySelectorAll('.query-info-form')).toHaveLength(1);
            });
            expect(document.querySelectorAll('.toggle-group-icon')).toHaveLength(2);
            expect(document.querySelectorAll('input#update')).toHaveLength(1);
            expect(document.querySelector('input#update').getAttribute('value')).toBe('abc');
            expect(document.querySelectorAll('.attachment-card__name')).toHaveLength(1);
            expect(document.querySelector('.attachment-card__name')).toHaveTextContent('test.txt');
        });

        test('filters with uniqueFieldKey', async () => {
            render(<BulkUpdateForm {...DEFAULT_PROPS} uniqueFieldKey="update" />);

            await waitFor(() => {
                expect(document.querySelectorAll('.query-info-form')).toHaveLength(1);
            });
            expect(document.querySelectorAll('.toggle-group-icon')).toHaveLength(1);
            expect(document.querySelectorAll('input#update')).toHaveLength(0);
            expect(document.querySelectorAll('.attachment-card__name')).toHaveLength(1);
        });
    });
});
