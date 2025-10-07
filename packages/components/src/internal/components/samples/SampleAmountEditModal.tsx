import React, { FC, memo, useCallback, useState } from 'react';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { caseInsensitive } from '../../util/utils';
import { Alert } from '../base/Alert';

import { UnitModel } from '../../util/measurement';

import { Modal } from '../../Modal';

import { CommentTextArea } from '../forms/input/CommentTextArea';

import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

import { updateSampleStorageData } from './actions';
import { STORED_AMOUNT_FIELDS } from './constants';
import { StorageAmountInput } from './StorageAmountInput';

interface Props {
    noun: string;
    onClose: () => void;
    row: any;
    schemaQuery: SchemaQuery;
    updateListener: () => void;
}

// exported for jest testing
export const isValid = (amount: number, units: string): boolean => {
    const hasAmount = amount !== undefined && amount !== null;
    const hasUnits = units !== undefined && units !== null && units !== '';
    const hasBoth = hasAmount && hasUnits;
    const hasNeither = !hasAmount && !hasUnits;

    if (hasBoth) {
        return amount >= 0;
    }
    return hasNeither;
};

export const SampleAmountEditModal: FC<Props> = memo(props => {
    const { noun, onClose, updateListener, row } = props;

    const {
        [STORED_AMOUNT_FIELDS.ROWID]: rowId,
        [STORED_AMOUNT_FIELDS.UNITS]: units,
        [STORED_AMOUNT_FIELDS.AMOUNT]: storedAmount,
        [STORED_AMOUNT_FIELDS.SAMPLE_TYPE_UNITS]: sampleTypeUnits,
    } = row;

    const sampleContainer = caseInsensitive(row, 'Container/Path')?.value;
    const initStorageUnits = units?.value;
    const initStorageAmount = storedAmount?.value;
    const [amount, setStorageAmount] = useState<number>(initStorageAmount);
    const [storageUnits, setStorageUnits] = useState<string>(initStorageUnits ?? null);
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState();
    const [isDirty, setIsDirty] = useState(false);
    const { requiresUserComment } = useDataChangeCommentsRequired();
    const hasValidUserComment = comment?.trim()?.length > 0;

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleUpdateSampleRow = (): Promise<any> => {
        const sampleData = [
            {
                materialId: rowId?.value,
                [STORED_AMOUNT_FIELDS.AMOUNT]: amount,
                [STORED_AMOUNT_FIELDS.UNITS]: storageUnits,
            },
        ];
        return updateSampleStorageData(sampleData, sampleContainer, comment);
    };

    const onSubmit = useCallback(async () => {
        setSubmitting(true);

        if (!isValid(amount, storageUnits)) {
            return;
        }

        try {
            await handleUpdateSampleRow();
            setSubmitting(false);
            updateListener();
            onClose();
        } catch (e) {
            setSubmitting(false);
            setError(e);
        }
    }, [amount, storageUnits, handleUpdateSampleRow, updateListener, onClose]);

    const amountChangeHandler = useCallback(
        (newAmount: string) => {
            let newVal = parseFloat(newAmount);
            if (isNaN(newVal)) {
                newVal = null; // set to null to indicate any existing value should be cleared; undefined values are removed before submission.
            }

            setStorageAmount(newVal);
            setIsDirty(_isDirty => _isDirty || newVal !== initStorageAmount);
        },
        [initStorageAmount]
    );

    const unitsChangeHandler = useCallback(
        (newUnits: string) => {
            const units = newUnits ?? null;
            setStorageUnits(units);
            setIsDirty(
                _isDirty => _isDirty || units?.localeCompare(initStorageUnits, 'en-US', { sensitivity: 'base' }) !== 0
            );
        },
        [initStorageUnits]
    );

    const commentChangeHandler = useCallback(_comment => {
        setComment(_comment);
    }, []);

    let canConfirm = isDirty && isValid(amount, storageUnits);
    if (requiresUserComment) canConfirm = canConfirm && hasValidUserComment;

    const unitModel = new UnitModel(amount, storageUnits);
    return (
        <Modal
            canConfirm={canConfirm}
            confirmText={`Update ${noun}`}
            isConfirming={submitting}
            onCancel={onCancel}
            onConfirm={onSubmit}
            title="Edit Sample Amounts"
        >
            <Alert bsStyle="danger">{error}</Alert>
            <StorageAmountInput
                amountChangedHandler={amountChangeHandler}
                label="Amount"
                model={unitModel}
                preferredUnit={sampleTypeUnits?.value}
                unitsChangedHandler={unitsChangeHandler}
            />
            <CommentTextArea
                actionName="Update"
                containerClassName="form-group storage-action-form-group"
                onChange={commentChangeHandler}
                requiresUserComment={requiresUserComment}
            />
        </Modal>
    );
});

SampleAmountEditModal.displayName = 'SampleAmountEditModal';
