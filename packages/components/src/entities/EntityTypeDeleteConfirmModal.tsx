import React, { FC, memo, useMemo } from 'react';

import { SampleOperation } from '../internal/components/samples/constants';
import { buildURL } from '../internal/url/AppURL';

import { DeleteConfirmationModal, DeleteConfirmationModalProps } from './DeleteConfirmationModal';

interface Props extends DeleteConfirmationModalProps {
    deleteConfirmationActionName?: string;
    isSample?: boolean;
    isShared?: boolean;
    noun: string;
    rowId: number;
    showDependenciesLink?: boolean;
}

export const EntityTypeDeleteConfirmModal: FC<Props> = memo(props => {
    const {
        deleteConfirmationActionName,
        isShared,
        isSample,
        noun,
        rowId,
        showDependenciesLink = false,
        ...rest
    } = props;

    const dependencies = useMemo(() => {
        if (!showDependenciesLink || !deleteConfirmationActionName) return 'dependencies';

        const params: Record<string, any> = { singleObjectRowId: rowId.toString() };

        if (isSample) {
            params.sampleOperation = SampleOperation[SampleOperation.Delete];
        }

        return <a href={buildURL('experiment', deleteConfirmationActionName, params)}>dependencies</a>;
    }, [deleteConfirmationActionName, isSample, rowId, showDependenciesLink]);

    return (
        <DeleteConfirmationModal
            {...rest}
            cancelButtonText="Cancel"
            confirmButtonText="Yes, Delete"
            title={`Permanently delete ${isShared ? 'shared ' : ''}${noun.toLowerCase()} type?`}
        >
            The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
            {isShared && (
                <>
                    {' '}
                    Because this is a <strong>shared</strong> {noun.toLowerCase()} type, you may be affecting other
                    folders.
                </>
            )}
        </DeleteConfirmationModal>
    );
});
