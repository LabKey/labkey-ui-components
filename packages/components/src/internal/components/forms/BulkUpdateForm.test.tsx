/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { GridResponse } from '../editable/models';

import { getTestAPIWrapper } from '../../APIWrapper';

import { BulkUpdateForm, BulkUpdateFormProps, errorMessage, SelectionWarning } from './BulkUpdateForm';
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
    nounPlural: QUERY,
    nounSingular: QUERY,
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
            expect(document.querySelectorAll('input[name="update"]')).toHaveLength(1);
            expect(document.querySelector('input[name="update"]')).toHaveValue('abc');
            expect(document.querySelectorAll('.attachment-card__name')).toHaveLength(1);
            expect(document.querySelector('.attachment-card__name')).toHaveTextContent('test.txt');
        });

        test('filters with uniqueFieldKey', async () => {
            render(<BulkUpdateForm {...DEFAULT_PROPS} uniqueFieldKey="update" />);

            await waitFor(() => {
                expect(document.querySelectorAll('.query-info-form')).toHaveLength(1);
            });
            expect(document.querySelectorAll('.toggle-group-icon')).toHaveLength(1);
            expect(document.querySelectorAll('input[name="update"]')).toHaveLength(0);
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
    const ONE_DELETED = 'Cannot edit 1 of the selected samples, it may have been deleted.';
    const TWO_DELETED = 'Cannot edit 2 of the selected samples, they may have been deleted.';

    test('samples and 2 aliquots', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                            { Name: 'A-4', RowId: 4 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN);
    });

    test('only aliquots', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={2}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(MULTI_ALIQUOTS_WARN);
    });

    test('one aliquot', () => {
        render(
            <SelectionWarning
                aliquots={[1]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={2}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(SINGLE_ALIQUOT_WARN);
    });

    test('only aliquots, some locked', () => {
        render(
            <SelectionWarning
                aliquots={[1, 2]}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [{ Name: 'A-1', RowId: 1 }],
                        notAllowed: [{ Name: 'A-2', RowId: 2 }],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={2}
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
                        allowed: [{ Name: 'A-1', RowId: 1 }],
                        notAllowed: [
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={3}
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
                        allowed: [{ Name: 'A-1', RowId: 1 }],
                        notAllowed: [
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={3}
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
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={3}
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
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                            { Name: 'A-4', RowId: 4 },
                        ],
                        notPermitted: [{ Name: 'A-4', RowId: 4 }],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
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
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                            { Name: 'A-4', RowId: 4 },
                        ],
                        notPermitted: [
                            { Name: 'A-3', RowId: 3 },
                            { Name: 'A-4', RowId: 4 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(TWO_NOT_PERMITTED_WARN);
    });

    test('one deleted', () => {
        render(
            <SelectionWarning
                aliquots={undefined}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={3}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(ONE_DELETED);
    });

    test('some deleted', () => {
        render(
            <SelectionWarning
                aliquots={undefined}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(TWO_DELETED);
    });

    test('some deleted, not permitted', () => {
        render(
            <SelectionWarning
                aliquots={undefined}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                        ],
                        notPermitted: [{ Name: 'A-2', RowId: 2 }],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(ONE_NOT_PERMITTED_WARN + TWO_DELETED);
    });

    test('1 deleted, 1 not permitted, 1 not allowed', () => {
        render(
            <SelectionWarning
                aliquots={undefined}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                        notAllowed: [{ Name: 'A-2', RowId: 2 }],
                        notPermitted: [{ Name: 'A-3', RowId: 3 }],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={4}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(
            ONE_LOCKED_WARN + ONE_NOT_PERMITTED_WARN + ONE_DELETED
        );
    });

    test('some deleted, some not permitted, some not allowed', () => {
        render(
            <SelectionWarning
                aliquots={undefined}
                editStatusData={
                    new OperationConfirmationData({
                        allowed: [
                            { Name: 'A-1', RowId: 1 },
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                        notAllowed: [
                            { Name: 'A-4', RowId: 4 },
                            { Name: 'A-5', RowId: 5 },
                        ],
                        notPermitted: [
                            { Name: 'A-2', RowId: 2 },
                            { Name: 'A-3', RowId: 3 },
                        ],
                    })
                }
                nounPlural="samples"
                nounSingular="sample"
                sampleOperation={SampleOperation.EditMetadata}
                selectedCount={7}
            />
        );
        expect(document.querySelector('.alert').textContent).toBe(
            TWO_LOCKED_WARN + TWO_NOT_PERMITTED_WARN + TWO_DELETED
        );
    });
});

describe('errorMessage', () => {
    test('some valid', () => {
        let editStatusData = new OperationConfirmationData({
            allowed: [{ Name: 'A-1', RowId: 1 }],
            notAllowed: [],
        });
        // 3 deleted, 1 allowed, is valid state
        let error = errorMessage(editStatusData, 'things', 'thing', 4);
        expect(error).toEqual(undefined);

        // 1 allowed is valid state
        error = errorMessage(editStatusData, 'things', 'thing', 1);
        expect(error).toEqual(undefined);

        editStatusData = new OperationConfirmationData({
            allowed: [],
            notAllowed: [{ Name: 'A-1', RowId: 1 }],
            notPermitted: [],
        });

        // 1 not allowed, 4 deleted is valid state
        error = errorMessage(editStatusData, 'things', 'thing', 4);
        expect(error).toEqual(undefined);

        // 1 not allowed is valid state
        error = errorMessage(editStatusData, 'things', 'thing', 1);
        expect(error).toEqual(undefined);

        editStatusData = new OperationConfirmationData({
            allowed: [
                { Name: 'A-1', RowId: 1 },
                { Name: 'A-2', RowId: 2 },
            ],
            notAllowed: [],
            notPermitted: [{ Name: 'A-1', RowId: 1 }],
        });

        // 1 allowed, 1 not permitted, 2 deleted is valid state
        error = errorMessage(editStatusData, 'things', 'thing', 4);
        expect(error).toEqual(undefined);

        // 1 allowed, 1 not permitted is valid state
        error = errorMessage(editStatusData, 'things', 'thing', 2);
        expect(error).toEqual(undefined);
    });
    test('all deleted', () => {
        const editStatusData = new OperationConfirmationData({
            allowed: [],
            notAllowed: [],
        });
        let error = errorMessage(editStatusData, 'things', 'thing', 4);
        expect(error).toEqual('Cannot edit selected things, they may have been deleted.');
        error = errorMessage(editStatusData, 'things', 'thing', 1);
        expect(error).toEqual('Cannot edit selected thing, it may have been deleted.');
    });
    test('all not permitted', () => {
        let editStatusData = new OperationConfirmationData({
            allowed: [
                { Name: 'A-1', RowId: 1 },
                { Name: 'A-2', RowId: 2 },
            ],
            notAllowed: [],
            notPermitted: [
                { Name: 'A-1', RowId: 1 },
                { Name: 'A-2', RowId: 2 },
            ],
        });
        let error = errorMessage(editStatusData, 'things', 'thing', 2);
        expect(error).toEqual('Cannot edit selected things, you do not have the required permissions.');
        editStatusData = new OperationConfirmationData({
            allowed: [{ Name: 'A-1', RowId: 1 }],
            notAllowed: [],
            notPermitted: [{ Name: 'A-1', RowId: 1 }],
        });
        error = errorMessage(editStatusData, 'things', 'thing', 1);
        expect(error).toEqual('Cannot edit selected thing, you do not have the required permissions.');
    });
    test('mix of deleted and not permitted', () => {
        const editStatusData = new OperationConfirmationData({
            allowed: [{ Name: 'A-1', RowId: 1 }],
            notAllowed: [],
            notPermitted: [{ Name: 'A-1', RowId: 1 }],
        });
        const error = errorMessage(editStatusData, 'things', 'thing', 2);
        expect(error).toEqual(
            'Cannot edit selected things, you do not have the required permissions, or they may have been deleted.'
        );
    });
});
