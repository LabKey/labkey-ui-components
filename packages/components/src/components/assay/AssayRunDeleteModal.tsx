import React, { useState } from 'react';

import { createDeleteErrorNotification, createDeleteSuccessNotification, deleteAssayRuns, Progress } from '../..';

import { AssayRunDeleteConfirmModal } from './AssayRunDeleteConfirmModal';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    numToDelete: number;
    onCancel: () => void;
    selectionKey?: string;
    selectedRowId?: string;
}

export function AssayRunDeleteModal(props: Props) {
    const { afterDelete, afterDeleteFailure, numToDelete, onCancel, selectionKey, selectedRowId } = props;
    const [showProgress, setShowProgress] = useState<boolean>();
    const noun = numToDelete === 1 ? ' assay run' : ' assay runs';

    function onConfirm(): void {
        setShowProgress(true);
        deleteAssayRuns(selectionKey, selectedRowId, true)
            .then(response => {
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
            })
            .catch(reason => {
                console.error(reason);
                setShowProgress(false);
                createDeleteErrorNotification(noun);
                afterDeleteFailure();
            });
    }

    return (
        <>
            {!showProgress && (
                <AssayRunDeleteConfirmModal numToDelete={numToDelete} onConfirm={onConfirm} onCancel={onCancel} />
            )}
            <Progress
                modal={true}
                estimate={numToDelete * 10}
                title={'Deleting ' + numToDelete + noun}
                toggle={showProgress}
            />
        </>
    );
}
