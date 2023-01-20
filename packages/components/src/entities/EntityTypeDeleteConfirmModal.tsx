import React, { FC, memo, useMemo } from 'react';
import { Map } from 'immutable';

import { SampleOperation } from '../internal/components/samples/constants';
import { buildURL } from '../internal/url/AppURL';
import {
    DeleteConfirmationModal,
    DeleteConfirmationModalProps,
} from '../internal/components/entities/DeleteConfirmationModal';

interface Props extends Omit<DeleteConfirmationModalProps, 'message'> {
    deleteConfirmationActionName?: string;
    isSample?: boolean;
    isShared?: boolean;
    noun: string;
    rowId: number;
    showDependenciesLink?: boolean;
}

export const EntityTypeDeleteConfirmModal: FC<Props> = memo(props => {
    const {
        isShared,
        isSample,
        showDependenciesLink = false,
        rowId,
        deleteConfirmationActionName,
        noun,
        ...rest
    } = props;

    const dependencies = useMemo(() => {
        if (!showDependenciesLink || !deleteConfirmationActionName) return undefined;

        let params = Map<string, string>();
        params = params.set('singleObjectRowId', rowId.toString());
        if (isSample) {
            params = params.set('sampleOperation', SampleOperation[SampleOperation.Delete]);
        }

        return (
            <>
                <a href={buildURL('experiment', deleteConfirmationActionName, params.toJS())}>dependencies</a>
            </>
        );
    }, [deleteConfirmationActionName, isSample, rowId, showDependenciesLink]);

    const message = useMemo(() => {
        return (
            <>
                The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
                {isShared && (
                    <>
                        {' '}
                        Because this is a <strong>shared</strong> {noun.toLowerCase()} type, you may be affecting other
                        folders.
                    </>
                )}
            </>
        );
    }, [dependencies, isShared, noun]);

    return (
        <DeleteConfirmationModal
            {...rest}
            cancelButtonText="Cancel"
            confirmButtonText="Yes, Delete"
            message={message}
            title={`Permanently delete ${isShared ? 'shared ' : ''}${noun.toLowerCase()} type?`}
        />
    );
});
