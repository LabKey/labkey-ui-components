import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { GridResponse } from '../editable/models';

import { getTestAPIWrapper } from '../../APIWrapper';

import { BulkUpdateForm, BulkUpdateFormProps, SelectionWarning } from './BulkUpdateForm';
import { SampleOperation } from '../samples/constants';
import { OperationConfirmationData } from '../entities/models';

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

describe('SelectionWarning', () => {
    const SINGLE_ALIQUOT_WARN =
        'Since 1 aliquot was among the selected samples, only the aliquot-editable fields are shown below.';
    const MULTI_ALIQUOTS_WARN =
        'Since 2 aliquots were among the selected samples, only the aliquot-editable fields are shown below.';
    const ONE_LOCKED_WARN =
        'The current status of 1 selected sample prevents updating of its data. Either change the status here or remove these samples from your selection.';
    const TWO_LOCKED_WARN =
        'The current status of 2 selected samples prevents updating of their data. Either change the status here or remove these samples from your selection.';
    const ONE_NOT_PERMITTED_WARN =
        'The selection includes 1 sample that you do not have permission to edit. Updates will only be made to the samples you have edit permission for.';
    const TWO_NOT_PERMITTED_WARN =
        'The selection includes 2 samples that you do not have permission to edit. Updates will only be made to the samples you have edit permission for.';

    test('samples and one aliquot, no editStatusData', () => {
        render(
            <SelectionWarning
                aliquots={[1]}
                editStatusData={undefined}
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(SINGLE_ALIQUOT_WARN);
    });

    test('samples and 2 aliquots', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={undefined}
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN);
    });

    test('only aliquots', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={undefined}
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN);
    });

    test('only aliquots, some locked', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                        ],
                        notAllowed: [
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN + ONE_LOCKED_WARN);
    });

    test('some aliquots, some locked', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                        ],
                        notAllowed: [
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                            {
                                Name: 'A-3',
                                RowId: 3,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN + ONE_LOCKED_WARN);
    });

    test('no aliquots, some locked', () => {
        render(
            <SelectionWarning
                aliquots={[]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                        ],
                        notAllowed: [
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                            {
                                Name: 'A-3',
                                RowId: 3,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(TWO_LOCKED_WARN);
    });

    test('no aliquots, all allowed', () => {
        render(
            <SelectionWarning
                aliquots={[]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                            {
                                Name: 'A-3',
                                RowId: 3,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert')).toBeNull();
    });

    test('one notPermitted', () => {
        render(
            <SelectionWarning
                aliquots={[]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                            {
                                Name: 'A-3',
                                RowId: 3,
                            },
                        ],
                        notPermitted: [
                            {
                                Name: 'A-4',
                                RowId: 4,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(ONE_NOT_PERMITTED_WARN);
    });

    test('multiple notPermitted', () => {
        render(
            <SelectionWarning
                aliquots={[]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            {
                                Name: 'A-1',
                                RowId: 1,
                            },
                            {
                                Name: 'A-2',
                                RowId: 2,
                            },
                            {
                                Name: 'A-3',
                                RowId: 3,
                            },
                        ],
                        notPermitted: [
                            {
                                Name: 'A-4',
                                RowId: 4,
                            },
                            {
                                Name: 'A-5',
                                RowId: 5,
                            },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(TWO_NOT_PERMITTED_WARN);
    });
});
