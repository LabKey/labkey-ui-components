import React from 'react';
import { Map } from 'immutable';

import { ConfirmModal, buildURL } from '../../..';

interface Props {
    onConfirm: () => any;
    onCancel: () => any;
    rowId: number;
    noun: string;
    deleteConfirmationActionName?: string;
    showDependenciesLink: boolean;
}

export class EntityTypeDeleteConfirmModal extends React.Component<Props, any> {
    static defaultProps = {
        showDependenciesLink: false,
    };

    render() {
        const { onConfirm, onCancel, showDependenciesLink, rowId, deleteConfirmationActionName, noun } = this.props;

        let dependencies = <>dependencies</>;
        if (showDependenciesLink && deleteConfirmationActionName) {
            let params = Map<string, string>();
            params = params.set('singleObjectRowId', rowId.toString());
            dependencies = (
                <a href={buildURL('experiment', deleteConfirmationActionName, params.toJS())}>dependencies</a>
            );
        }

        return (
            <ConfirmModal
                title={'Permanently delete ' + noun.toLowerCase() + ' type?'}
                msg={
                    <span>
                        The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
                        <p className="top-spacing">
                            <strong>Deletion cannot be undone. </strong>
                            Do you want to proceed?
                        </p>
                    </span>
                }
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Delete"
                cancelButtonText="Cancel"
            />
        );
    }
}
