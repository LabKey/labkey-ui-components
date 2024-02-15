import React, { FC, memo, useCallback, useState } from 'react';
import { AuditBehaviorTypes } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { useServerContext } from '../base/ServerContext';
import { caseInsensitive } from '../../util/utils';
import { Alert } from '../base/Alert';

import { isValuePrecisionValid, MEASUREMENT_UNITS, UnitModel } from '../../util/measurement';

import { useAppContext } from '../../AppContext';
import { Modal } from '../../Modal';

import { CommentTextArea } from '../forms/input/CommentTextArea';

import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

import { updateSampleStorageData } from './actions';
import { AMOUNT_PRECISION_ERROR_TEXT, STORED_AMOUNT_FIELDS } from './constants';
import { StorageAmountInput } from './StorageAmountInput';

interface Props {
    noun: string;
    onClose: () => void;
    row: any;
    schemaQuery: SchemaQuery;
    updateListener: () => void;
}

const isPrecisionValid = (amount: number, storageUnits: string): boolean => {
    const units = MEASUREMENT_UNITS[storageUnits?.toLowerCase()];
    return isValuePrecisionValid(amount, units?.displayPrecision);
};

const isValid = (amount: number, units: string): boolean => {
    return amount === undefined || (amount >= 0 && isPrecisionValid(amount, units));
};

export const SampleAmountEditModal: FC<Props> = memo(props => {
    const { schemaQuery, noun, onClose, updateListener, row } = props;
    const { api } = useAppContext();
    const { user } = useServerContext();

    const {
        [STORED_AMOUNT_FIELDS.ROWID]: rowId,
        [STORED_AMOUNT_FIELDS.UNITS]: Units,
        [STORED_AMOUNT_FIELDS.AMOUNT]: initStorageAmount,
    } = row;

    const sampleContainer = caseInsensitive(row, 'Container/Path')?.value;
    const initStorageUnits = Units?.value as string;
    const [amount, setStorageAmount] = useState<number>(initStorageAmount?.value ?? undefined);
    const [storageUnits, setStorageUnits] = useState<string>(initStorageUnits ?? '');
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
        // Issue 41931: html input number step value only validates to a certain precision
        const precision = storageUnits ? MEASUREMENT_UNITS[storageUnits.toLowerCase()]?.displayPrecision : 2;
        if (!isValuePrecisionValid(amount, precision)) {
            return Promise.reject(AMOUNT_PRECISION_ERROR_TEXT);
        }

        // users that can update samples use regular updateRows, but users with storage editor permission use a special controller action
        if (user.canUpdate) {
            return api.query.updateRows({
                schemaQuery,
                rows: [
                    {
                        rowId: rowId?.value,
                        [STORED_AMOUNT_FIELDS.AMOUNT]: amount,
                        [STORED_AMOUNT_FIELDS.UNITS]: storageUnits,
                    },
                ],
                [STORED_AMOUNT_FIELDS.AUDIT_COMMENT]: comment,
                containerPath: sampleContainer,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        } else {
            const sampleData = [
                {
                    materialId: rowId?.value,
                    [STORED_AMOUNT_FIELDS.AMOUNT]: amount,
                    [STORED_AMOUNT_FIELDS.UNITS]: storageUnits,
                },
            ];
            return updateSampleStorageData(sampleData, sampleContainer, comment);
        }
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
            setError(e.exception);
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
            const units = newUnits ?? initStorageUnits;
            setStorageUnits(units);
            setIsDirty(
                _isDirty => _isDirty || units?.localeCompare(initStorageUnits, 'en-US', { sensitivity: 'base' }) !== 0
            );
        },
        [initStorageUnits]
    );

    const commentChangeHandler = useCallback(evt => {
        setComment(evt.target.value);
    }, []);

    const amountCaption = initStorageUnits === storageUnits ? `Amount (${storageUnits})` : 'Amount';

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
            titleText="Edit Sample Amounts"
        >
            <Alert bsStyle="danger">{error}</Alert>
            <StorageAmountInput
                model={unitModel}
                preferredUnit={initStorageUnits}
                amountChangedHandler={amountChangeHandler}
                unitsChangedHandler={unitsChangeHandler}
                label={amountCaption}
            />
            <CommentTextArea
                containerClassName="form-group storage-action-form-group"
                actionName="update"
                onChange={commentChangeHandler}
                requiresUserComment={requiresUserComment}
            />
        </Modal>
    );
});

SampleAmountEditModal.displayName = 'SampleAmountEditModal';
