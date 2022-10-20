import React, { FC, useState } from 'react';
import { Ajax, Utils } from '@labkey/api';

import { deleteErrorMessage, deleteSuccessMessage } from '../internal/util/messaging';
import { AssayRunDataType } from '../internal/components/entities/constants';

import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { EntityDeleteConfirmModal } from '../internal/components/entities/EntityDeleteConfirmModal';
import { Progress } from '../internal/components/base/Progress';
import { buildURL } from '../internal/url/AppURL';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    containerPath?: string;
    onCancel: () => void;
    selectedRowId?: string;
    selectionKey?: string;
}

export const AssayRunDeleteModal: FC<Props> = props => {
    const { afterDelete, afterDeleteFailure, containerPath, onCancel, selectionKey, selectedRowId } = props;
    const { createNotification } = useNotificationsContext();
    const [numToDelete, setNumToDelete] = useState<number>(undefined);
    const [showProgress, setShowProgress] = useState<boolean>(false);

    const onConfirm = async (rowsToDelete: any[]): Promise<void> => {
        if (rowsToDelete.length == 0) {
            afterDelete();
            return;
        }

        setNumToDelete(rowsToDelete.length);
        setShowProgress(true);
        const noun = rowsToDelete.length === 1 ? ' assay run' : ' assay runs';
        try {
            const response = await deleteAssayRuns(undefined, rowsToDelete, true, containerPath);

            const numRunsCascadeDeleted = response.hasOwnProperty('runIdsCascadeDeleted')
                ? response.runIdsCascadeDeleted.length
                : 0;
            const additionalInfo =
                numRunsCascadeDeleted > 0
                    ? ' In addition, ' +
                      numRunsCascadeDeleted +
                      ' replaced ' +
                      (numRunsCascadeDeleted === 1 ? 'run was' : 'runs were') +
                      ' also deleted.'
                    : '';

            afterDelete();
            createNotification(deleteSuccessMessage(noun, rowsToDelete.length, additionalInfo));
        } catch (error) {
            console.error(error);
            setShowProgress(false);
            createNotification({
                alertClass: 'danger',
                message: deleteErrorMessage(noun),
            });
            afterDeleteFailure();
        }
    };

    const getDeletionDescription = (numToDelete: number) => {
        const noun = numToDelete === 1 ? ' assay run' : ' assay runs';

        return (
            <>
                The entirety of the {numToDelete > 1 ? numToDelete : ''} {noun} and any of{' '}
                {numToDelete === 1 ? 'its' : 'their'} previously replaced versions will be permanently deleted.
            </>
        );
    };

    return (
        <>
            {!showProgress && (
                <EntityDeleteConfirmModal
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    entityDataType={AssayRunDataType}
                    selectionKey={selectionKey}
                    rowIds={[selectedRowId]}
                    getDeletionDescription={getDeletionDescription}
                />
            )}
            <Progress
                estimate={numToDelete * 10}
                modal={true}
                title={`Deleting ${numToDelete}${numToDelete === 1 ? ' assay run' : ' assay runs'}`}
                toggle={showProgress}
            />
        </>
    );
};

function deleteAssayRuns(
    selectionKey?: string,
    rowIds?: string[],
    cascadeDeleteReplacedRuns = false,
    containerPath?: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        const jsonData: any = selectionKey ? { dataRegionSelectionKey: selectionKey } : { rowIds };
        jsonData.cascade = cascadeDeleteReplacedRuns;

        return Ajax.request({
            url: buildURL('experiment', 'deleteRuns.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}
