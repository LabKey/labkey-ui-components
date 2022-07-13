import React, { FC, useMemo, useState } from 'react';

import { ConfirmModal, deleteAssayRuns, Progress, useNotificationsContext } from '../../..';
import { deleteErrorMessage, deleteSuccessMessage } from '../../util/messaging';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    containerPath?: string;
    numToDelete: number;
    onCancel: () => void;
    selectedRowId?: string;
    selectionKey?: string;
}

export const AssayRunDeleteModal: FC<Props> = props => {
    const { afterDelete, afterDeleteFailure, containerPath, numToDelete, onCancel, selectionKey, selectedRowId } =
        props;
    const { createNotification } = useNotificationsContext();
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const noun = useMemo<string>(() => (numToDelete === 1 ? ' assay run' : ' assay runs'), [numToDelete]);

    const onConfirm = async (): Promise<void> => {
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
                message: () => deleteErrorMessage(noun),
            });
            afterDeleteFailure();
        }
    };

    return (
        <>
            {!showProgress && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Yes, Delete"
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={'Permanently delete ' + numToDelete + noun + '?'}
                >
                    <span>
                        The entirety of the {numToDelete > 1 ? numToDelete : ''} selected {noun} and any of{' '}
                        {numToDelete === 1 ? 'its' : 'their'} previously replaced versions will be permanently deleted.
                        <p className="top-spacing">
                            <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                        </p>
                    </span>
                </ConfirmModal>
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
