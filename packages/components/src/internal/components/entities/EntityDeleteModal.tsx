import React, { FC, memo, useCallback, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import { MAX_SELECTED_SAMPLES } from '../samples/constants';

import { deleteErrorMessage, deleteSuccessMessage } from '../../util/messaging';

import { EntityDeleteConfirmModal } from './EntityDeleteConfirmModal';
import { EntityDataType } from './models';
import { getEntityNoun } from './utils';
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {useNotificationsContext} from "../notifications/NotificationsContext";
import {deleteRows} from "../../query/api";
import {ConfirmModal} from "../base/ConfirmModal";
import {capitalizeFirstChar} from "../../util/utils";
import {Progress} from "../base/Progress";

interface Props {
    afterDelete: (rowsToKeep?: any[]) => any;
    auditBehavior?: AuditBehaviorTypes;
    beforeDelete?: () => any;
    entityDataType: EntityDataType;
    maxSelected?: number;
    onCancel: () => any;
    queryModel?: QueryModel;
    useSelected: boolean;
    verb?: string;
}

export const EntityDeleteModal: FC<Props> = memo(props => {
    const { auditBehavior, queryModel, onCancel, afterDelete, beforeDelete, useSelected, entityDataType, maxSelected } =
        props;
    const { nounPlural } = entityDataType;
    const { createNotification } = useNotificationsContext();
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
        [afterDelete, auditBehavior, beforeDelete, createNotification, entityDataType, queryModel.schemaQuery]
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
