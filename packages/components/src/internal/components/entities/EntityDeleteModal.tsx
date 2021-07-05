import React, { FC, memo, useCallback, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    capitalizeFirstChar,
    ConfirmModal,
    Progress,
    QueryGridModel,
    SchemaQuery,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteRows,
    QueryModel,
} from '../../..';

import { EntityDeleteConfirmModal } from './EntityDeleteConfirmModal';
import { EntityDataType } from './models';

function getNoun(entityDataType: EntityDataType, quantity: number): string {
    return quantity === 1 ? entityDataType.nounSingular : entityDataType.nounPlural;
}

interface Props {
    model?: QueryGridModel;
    queryModel?: QueryModel;
    maxSelected?: number;
    useSelected: boolean;
    beforeDelete?: () => any;
    afterDelete: (rowsToKeep?: any[]) => any;
    onCancel: () => any;
    entityDataType: EntityDataType;
    auditBehavior?: AuditBehaviorTypes;
    verb?: string;
}

export const EntityDeleteModal: FC<Props> = memo(props => {
    const {
        auditBehavior,
        model,
        queryModel,
        onCancel,
        afterDelete,
        beforeDelete,
        useSelected,
        entityDataType,
        maxSelected,
    } = props;
    const { nounPlural } = entityDataType;
    const [showProgress, setShowProgress] = useState(false);
    const [numConfirmed, setNumConfirmed] = useState(0);
    let rowIds;
    let numSelected = 0;
    let selectionKey: string;

    if (model) {
        if (useSelected) {
            if (model.isFiltered()) {
                rowIds = model.selectedIds.toArray();
                numSelected = rowIds.length;
            } else {
                numSelected = model.selectedQuantity;
                selectionKey = model.getId();
            }
        } else {
            rowIds = [model.dataIds.get(0)];
            numSelected = 1;
        }
    } else if (queryModel) {
        if (useSelected) {
            selectionKey = queryModel.id;
        } else {
            if (queryModel.hasData) {
                rowIds = [Object.keys(queryModel.rows)[0]];
                numSelected = 1;
            }
        }
    }

    const onConfirm = useCallback(
        async (rowsToDelete: any[], rowsToKeep: any[]) => {
            setNumConfirmed(rowsToDelete.length);
            setShowProgress(true);
            beforeDelete?.();
            const noun = ' ' + getNoun(entityDataType, rowsToDelete.length);

            try {
                await deleteRows({
                    auditBehavior,
                    rows: rowsToDelete,
                    schemaQuery: queryModel?.schemaQuery ?? SchemaQuery.create(model.schema, model.query),
                });
                afterDelete(rowsToKeep);
                createDeleteSuccessNotification(noun, rowsToDelete.length, undefined);
            } catch (e) {
                setShowProgress(false);
                createDeleteErrorNotification(noun);
            }
        },
        [auditBehavior, beforeDelete, entityDataType, model, queryModel]
    );

    if (!model && !queryModel) {
        return null;
    }

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={'Cannot Delete ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                onConfirm={undefined}
                cancelButtonText="Dismiss"
            >
                You cannot delete more than {maxSelected} individual {nounPlural} at a time. Please select fewer
                {nounPlural} and try again.
            </ConfirmModal>
        );
    }

    return (
        <>
            {!showProgress && (
                <EntityDeleteConfirmModal
                    selectionKey={selectionKey}
                    rowIds={rowIds}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    entityDataType={entityDataType}
                    verb={props.verb}
                />
            )}
            <Progress
                modal={true}
                estimate={numConfirmed * 10}
                title={`Deleting ${numConfirmed} ${getNoun(entityDataType, numConfirmed)}`}
                toggle={showProgress}
            />
        </>
    );
});
