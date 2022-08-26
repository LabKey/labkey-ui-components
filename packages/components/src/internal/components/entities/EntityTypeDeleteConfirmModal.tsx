import React from 'react';
import { Map } from 'immutable';
import {SampleOperation} from "../samples/constants";
import {buildURL} from "../../url/AppURL";
import {ConfirmModal} from "../base/ConfirmModal";

interface Props {
    onConfirm: () => any;
    onCancel: () => any;
    rowId: number;
    noun: string;
    isSample?: boolean;
    deleteConfirmationActionName?: string;
    showDependenciesLink: boolean;
    isShared?: boolean;
}

export class EntityTypeDeleteConfirmModal extends React.Component<Props, any> {
    static defaultProps = {
        showDependenciesLink: false,
    };

    render() {
        const {
            isShared,
            isSample,
            onConfirm,
            onCancel,
            showDependenciesLink,
            rowId,
            deleteConfirmationActionName,
            noun,
        } = this.props;

        let dependencies = <>dependencies</>;
        if (showDependenciesLink && deleteConfirmationActionName) {
            let params = Map<string, string>();
            params = params.set('singleObjectRowId', rowId.toString());
            if (isSample) {
                params = params.set('sampleOperation', SampleOperation[SampleOperation.Delete]);
            }
            dependencies = (
                <a href={buildURL('experiment', deleteConfirmationActionName, params.toJS())}>dependencies</a>
            );
        }

        return (
            <ConfirmModal
                title={`Permanently delete ${isShared ? 'shared ' : ''}${noun.toLowerCase()} type?`}
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Delete"
                cancelButtonText="Cancel"
            >
                <span>
                    The {noun.toLowerCase()} type and all of its {dependencies} will be permanently deleted.
                    {isShared && (
                        <>
                            {' '}
                            Because this is a <strong>shared</strong> {noun.toLowerCase()} type, you may be affecting
                            other folders.
                        </>
                    )}
                    <p className="top-spacing">
                        <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                    </p>
                </span>
            </ConfirmModal>
        );
    }
}
