import React, { FC, memo, useCallback, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    capitalizeFirstChar,
    ConfirmModal,
    Progress,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteRows,
    QueryModel,
} from '../../..';

import { MAX_SELECTED_SAMPLES } from '../samples/constants';

import { EntityDeleteConfirmModal } from './EntityDeleteConfirmModal';
import { EntityDataType } from './models';
import { getEntityNoun } from './utils';

interface Props {
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

    if (queryModel) {
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
            const noun = ' ' + getEntityNoun(entityDataType, rowsToDelete.length);

            try {
                await deleteRows({
                    auditBehavior,
                    rows: rowsToDelete,
                    schemaQuery: queryModel.schemaQuery,
                });
                afterDelete(rowsToKeep);
                createDeleteSuccessNotification(noun, rowsToDelete.length, undefined);
            } catch (e) {
                setShowProgress(false);
                createDeleteErrorNotification(noun);
            }
        },
        [afterDelete, auditBehavior, beforeDelete, entityDataType, queryModel]
    );

    if (!queryModel) {
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
                title={`Deleting ${numConfirmed} ${getEntityNoun(entityDataType, numConfirmed)}`}
                toggle={showProgress}
            />
        </>
    );
});

EntityDeleteModal.defaultProps = {
    auditBehavior: AuditBehaviorTypes.DETAILED,
    maxSelected: MAX_SELECTED_SAMPLES,
};
