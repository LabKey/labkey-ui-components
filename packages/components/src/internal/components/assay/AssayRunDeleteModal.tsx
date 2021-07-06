import React, { FC, useMemo, useState } from 'react';

import {
    ConfirmModal,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteAssayRuns,
    Progress,
} from '../../..';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    numToDelete: number;
    onCancel: () => void;
    selectionKey?: string;
    selectedRowId?: string;
}

export const AssayRunDeleteModal: FC<Props> = props => {
    const { afterDelete, afterDeleteFailure, numToDelete, onCancel, selectionKey, selectedRowId } = props;
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const noun = useMemo<string>(() => (numToDelete === 1 ? ' assay run' : ' assay runs'), [numToDelete]);

    const onConfirm = async (): Promise<void> => {
        setShowProgress(true);

        try {
            const response = await deleteAssayRuns(selectionKey, selectedRowId, true);

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
            createDeleteSuccessNotification(noun, numToDelete, additionalInfo);
        } catch (error) {
            console.error(error);
            setShowProgress(false);
            createDeleteErrorNotification(noun);
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
