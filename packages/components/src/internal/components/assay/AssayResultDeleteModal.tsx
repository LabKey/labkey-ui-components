import React, { FC, useMemo, useState } from 'react';

import {
    ConfirmModal,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    deleteRows,
    Progress,
    SchemaQuery,
} from '../../../index';

interface Props {
    afterDelete: () => void;
    afterDeleteFailure: () => void;
    maxToDelete?: number;
    onCancel: () => void;
    schemaQuery: SchemaQuery;
    selectedIds: string[];
}

export const AssayResultDeleteModal: FC<Props> = props => {
    const { onCancel, afterDelete, afterDeleteFailure, maxToDelete, schemaQuery, selectedIds } = props;
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const numToDelete = selectedIds.length;
    const noun = useMemo<string>(() => (numToDelete ? ' assay result' : ' assay results'), [numToDelete]);

    const onConfirm = async (): Promise<void> => {
        setShowProgress(true);

        try {
            await deleteRows({
                rows: selectedIds.map(id => ({ RowId: id })),
                schemaQuery,
            });

            afterDelete();
            createDeleteSuccessNotification(noun, numToDelete);
        } catch (error) {
            console.error(error);
            setShowProgress(false);
            createDeleteErrorNotification(noun);
            afterDeleteFailure();
        }
    };

    if (maxToDelete && numToDelete > maxToDelete) {
        return (
            <ConfirmModal
                cancelButtonText="Dismiss"
                msg={`You cannot delete more than ${maxToDelete} individual assay results at a time. Please select fewer results and try again.`}
                onCancel={onCancel}
                title="Cannot Delete Assay Results"
            />
        );
    }

    return (
        <>
            {!showProgress && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Yes, Delete"
                    msg={
                        <span>
                            The {numToDelete > 1 ? numToDelete : ''} selected {noun} will be permanently deleted.&nbsp;
                            <p className="top-spacing">
                                <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                            </p>
                        </span>
                    }
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={`Permanently delete ${numToDelete}${noun}?`}
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
