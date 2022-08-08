import React, { FC, useMemo, useState } from 'react';

import { deleteAssayRuns, EntityDeleteConfirmModal, Progress, useNotificationsContext } from '../../..';
import { deleteErrorMessage, deleteSuccessMessage } from '../../util/messaging';
import { AssayRunDataType } from '../entities/constants';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    containerPath?: string;
    onCancel: () => void;
    onConfirmDelete?: (rowsToDelete: any[]) => void;
    selectedRowId?: string;
    selectionKey?: string;
}

export const AssayRunDeleteModal: FC<Props> = props => {
    const { afterDelete, afterDeleteFailure, containerPath, onCancel, onConfirmDelete, selectionKey, selectedRowId } =
        props;
    const { createNotification } = useNotificationsContext();
    const [numToDelete, setNumToDelete] = useState<number>(undefined);
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const noun = useMemo<string>(() => (numToDelete === 1 ? ' assay run' : ' assay runs'), [numToDelete]);

    const onConfirm = async (rowsToDelete: any[], rowsToKeep: any[]): Promise<void> => {
        if (rowsToDelete.length == 0) {
            afterDelete();
            return;
        }

        onConfirmDelete?.(rowsToDelete);
        setNumToDelete(rowsToDelete.length);
        setShowProgress(true);

        try {
            const response = await deleteAssayRuns(selectionKey, selectedRowId, true, containerPath);

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
            createNotification(deleteSuccessMessage(noun, numToDelete, additionalInfo));
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
        )
    }

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
                title={`Deleting ${numToDelete}${noun}`}
                toggle={showProgress}
            />
        </>
    );
};
