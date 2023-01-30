import React, { FC, memo, useCallback, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import { MAX_SELECTED_SAMPLES } from '../internal/components/samples/constants';

import { deleteErrorMessage, deleteSuccessMessage } from '../internal/util/messaging';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { deleteRows } from '../internal/query/api';
import { ConfirmModal } from '../internal/components/base/ConfirmModal';
import { capitalizeFirstChar } from '../internal/util/utils';
import { Progress } from '../internal/components/base/Progress';

import { getEntityNoun } from '../internal/components/entities/utils';
import { EntityDataType } from '../internal/components/entities/models';
import { EntityDeleteConfirmModal } from '../internal/components/entities/EntityDeleteConfirmModal';
import { EntityDeleteConfirmHandler } from '../internal/components/entities/EntityDeleteConfirmModalDisplay';

interface Props {
    afterDelete: (rowsToKeep?: any[]) => void;
    auditBehavior?: AuditBehaviorTypes;
    beforeDelete?: () => void;
    containerPath?: string;
    entityDataType: EntityDataType;
    maxSelected?: number;
    onCancel: () => void;
    queryModel: QueryModel;
    useSelected: boolean;
    verb?: string;
}

export const EntityDeleteModal: FC<Props> = memo(props => {
    const {
        auditBehavior,
        containerPath,
        queryModel,
        onCancel,
        afterDelete,
        beforeDelete,
        useSelected,
        entityDataType,
        maxSelected,
    } = props;
    const { nounPlural } = entityDataType;
    const { createNotification } = useNotificationsContext();
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const [numConfirmed, setNumConfirmed] = useState<number>(0);
    let rowIds;
    let numSelected = 0;
    let selectionKey: string;
    let useSnapshotSelection = false;

    if (useSelected) {
        selectionKey = queryModel.selectionKey;
        useSnapshotSelection = queryModel.filterArray.length > 0;
    } else if (queryModel.hasData) {
        rowIds = [Object.keys(queryModel.rows)[0]];
        numSelected = 1;
    }

    const onConfirm: EntityDeleteConfirmHandler = useCallback(
        async (rowsToDelete, rowsToKeep, auditUserComment) => {
            setNumConfirmed(rowsToDelete.length);
            setShowProgress(true);
            beforeDelete?.();
            const noun = ' ' + getEntityNoun(entityDataType, rowsToDelete.length);

            try {
                await deleteRows({
                    auditBehavior,
                    auditUserComment,
                    containerPath,
                    rows: rowsToDelete,
                    schemaQuery: queryModel.schemaQuery,
                });
                afterDelete(rowsToKeep);
                createNotification(deleteSuccessMessage(noun, rowsToDelete.length, undefined));
            } catch (e) {
                setShowProgress(false);
                createNotification({
                    alertClass: 'danger',
                    message: deleteErrorMessage(noun),
                });
                onCancel(); // close the modal so the error notification is more apparent.
            }
        },
        [
            afterDelete,
            auditBehavior,
            beforeDelete,
            containerPath,
            createNotification,
            entityDataType,
            onCancel,
            queryModel.schemaQuery,
        ]
    );

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={'Cannot Delete ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
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
                    useSnapshotSelection={useSnapshotSelection}
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
