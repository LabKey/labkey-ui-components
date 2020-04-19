import React from 'react'
import { useState } from 'react'
import { AuditBehaviorTypes } from '@labkey/api';
import { capitalizeFirstChar } from '../../util/utils';
import { ConfirmModal } from '../base/ConfirmModal';
import { EntityDataType } from '../entities/models';
import { EntityDeleteConfirmModal } from '../entities/EntityDeleteConfirmModal';
import { Progress } from '../base/Progress';
import { QueryGridModel } from '../base/models/model';
import { createDeleteErrorNotification, createDeleteSuccessNotification } from '../notifications/messaging';
import { deleteEntityDataRows } from '../entities/actions';

interface Props {
    model: QueryGridModel
    maxSelected?: number
    useSelected: boolean
    beforeDelete: () => any
    afterDelete: (rowsToKeep?: Array<any>) => any
    onCancel: () => any
    entityDataType: EntityDataType
    auditBehavior?: AuditBehaviorTypes
    notify?: () => void
}

export function EntityDeleteModal(props: Props) {
    const { auditBehavior, model, onCancel, afterDelete, beforeDelete, useSelected, entityDataType, maxSelected } = props;
    const { nounSingular, nounPlural } = entityDataType;
    const [showProgress, setShowProgress] = useState(false);
    const [numConfirmed, setNumConfirmed] = useState(0);
    const noun =  ' ' + getNoun(numConfirmed);
    let rowIds = undefined;
    let numSelected = 0;
    if (useSelected) {
        if (model.isFiltered()) {
            rowIds = model.selectedIds.toArray();
            numSelected = rowIds.length;
        }
        else {
            numSelected = model.selectedQuantity;
        }
    }
    else {
        rowIds = [model.dataIds.get(0)];
        numSelected = 1;
    }

    function getNoun(quantity: number) {
        return quantity === 1 ? nounSingular : nounPlural;
    }

    function onConfirm(rowsToDelete: Array<any>, rowsToKeep: Array<any>): void {
        const { notify } = this.props;
        setNumConfirmed(rowsToDelete.length);
        setShowProgress(true);
        beforeDelete();
        const noun = ' ' + getNoun(rowsToDelete.length);

        deleteEntityDataRows(model, rowsToDelete, nounSingular, nounPlural, () => {
            afterDelete(rowsToKeep);
            createDeleteSuccessNotification(noun, rowsToDelete.length, notify);
            // createDeleteSuccessNotification(notify, noun, rowsToDelete.length);
        }, () => {
            setShowProgress(false);
            createDeleteErrorNotification(noun, notify);
            // createDeleteErrorNotification(notify, noun);
        }, auditBehavior);
    }

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={"Cannot Delete " + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                msg={"You cannot delete more than " + maxSelected + " individual " + nounPlural + " at a time.  "
                + " Please select fewer " + nounPlural + " and try again."}
                onConfirm={undefined}
                cancelButtonText={"Dismiss"}
            />
        )
    }

    return (
        <>
            {!showProgress &&
                <EntityDeleteConfirmModal
                    selectionKey={useSelected && !model.isFiltered() ? model.getId() : undefined}
                    rowIds={rowIds}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    entityDataType={entityDataType}
                />
            }
            <Progress
                modal={true}
                estimate={numConfirmed * 10}
                title={'Deleting ' + numConfirmed + noun}
                toggle={showProgress}
            />
        </>
    )
}