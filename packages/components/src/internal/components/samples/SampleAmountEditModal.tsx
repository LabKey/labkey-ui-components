import React, { FC, memo, useCallback, useState } from 'react';
import { AuditBehaviorTypes } from '@labkey/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { AMOUNT_PRECISION_ERROR_TEXT, STORED_AMOUNT_FIELDS } from './constants';
import { updateSampleStorageData } from './actions';
import { Button, Modal } from 'react-bootstrap';
import { useServerContext } from '../base/ServerContext';
import { caseInsensitive } from '../../util/utils';
import { updateRows } from '../../query/api';
import { Alert } from '../base/Alert';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { StorageAmountInput } from './StorageAmountInput';
import { isValuePrecisionValid, MEASUREMENT_UNITS, UnitModel } from '../../util/measurement';

interface Props {
    schemaQuery: SchemaQuery,
    row: any,
    noun: string,
    updateListener: () => void,
    onClose: () => void,
}


const isValid = (amount: number, units: string): boolean => {
    return amount === undefined || (amount >= 0 && isPrecisionValid(amount, units));
};
const isPrecisionValid = (amount: number, storageUnits: string): boolean => {
    const units = MEASUREMENT_UNITS[storageUnits?.toLowerCase()];
    return isValuePrecisionValid(amount, units?.displayPrecision);
};

export const SampleAmountEditModal: FC<Props> = memo(props => {
    const title = 'Edit Sample Amounts';
    const {schemaQuery, noun, onClose, updateListener, row} = props;
    const {user} = useServerContext();

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
    const [error, setError] = useState(undefined);
    const [isDirty, setIsDirty] = useState(false);

    const onCancel = useCallback(() => {
        onClose();
    }, []);

    const handleUpdateSampleRow = (): Promise<any> => {
        // Issue 41931: html input number step value only validates to a certain precision
        const precision = storageUnits ? MEASUREMENT_UNITS[storageUnits.toLowerCase()]?.displayPrecision : 2;
        if (!isValuePrecisionValid(amount, precision)) {
            return Promise.reject(AMOUNT_PRECISION_ERROR_TEXT);
        }

        // users that can update samples use regular updateRows, but users with storage editor permission use a special controller action
        if (user.canUpdate) {
            const options: any = {
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
            };

            return updateRows(options);
        } else {
            const sampleData = [
                {
                    materialId: rowId?.value,
                    [STORED_AMOUNT_FIELDS.AMOUNT]: amount,
                    [STORED_AMOUNT_FIELDS.UNITS]: storageUnits,
                }
            ];
            return updateSampleStorageData(sampleData, sampleContainer, comment);
        }
    };

    const onSubmit = useCallback(async () => {
        setSubmitting(true);

        if (isValid(amount, storageUnits)) {
            try {
                await handleUpdateSampleRow();
                setSubmitting(false);
                updateListener();
                onClose();
            }
            catch (error) {
                setSubmitting(false);
                setError(error.exception);
            }
        }
    }, [submitting, initStorageUnits, amount, storageUnits, comment, sampleContainer]);

    const amountChangeHandler = useCallback((newAmount: string) => {
        let newVal = parseFloat(newAmount);
        if (isNaN(newVal)) {
            newVal = undefined;
        }

        setStorageAmount(newVal);
        setIsDirty(isDirty || newVal !== initStorageAmount);
    }, [amount, isDirty]);

    const unitsChangeHandler = useCallback((newUnits: string) => {
        const units = newUnits ?? initStorageUnits;
        setStorageUnits(units);
        setIsDirty(isDirty || units?.localeCompare(initStorageUnits, 'en-US', {sensitivity: 'base'}) !== 0);
    }, [storageUnits, isDirty]);

    const commentChangeHandler = useCallback((evt) => {
        setComment(evt.target.value);
    }, [comment]);

    const amountCaption = initStorageUnits === storageUnits ? `Amount (${storageUnits})` : 'Amount';

    const canSubmit = isDirty && isValid(amount, storageUnits);
    const unitModel = new UnitModel(amount, storageUnits);
    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert bsStyle={'danger'}>{error}</Alert>
                <div>
                    <StorageAmountInput
                        model={unitModel}
                        preferredUnit={initStorageUnits}
                        amountChangedHandler={amountChangeHandler}
                        unitsChangedHandler={unitsChangeHandler}
                        label={amountCaption}
                    />
                    <div className="form-group storage-action-form-group">
                        <span>
                            User Comment
                            <LabelHelpTip placement="top" title={'Comment'}>
                                Additional information about this update.
                            </LabelHelpTip>
                        </span>
                        <textarea
                            className="form-control"
                            id="userComment"
                            placeholder="Enter comments (optional)"
                            rows={5}
                            onChange={commentChangeHandler}
                            value={comment}
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <>
                    <Button className="pull-left" disabled={submitting} onClick={onCancel}>Cancel</Button>
                    <Button
                        className="pull-right"
                        bsStyle="success"
                        disabled={submitting || !canSubmit}
                        onClick={onSubmit}>
                        Update {noun}
                    </Button>
                </>
            </Modal.Footer>
        </Modal>
    );

});
