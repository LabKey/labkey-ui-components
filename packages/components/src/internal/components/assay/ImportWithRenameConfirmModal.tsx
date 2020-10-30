import React from 'react';

import { ConfirmModal } from '../../..';

interface Props {
    onConfirm: () => any;
    onCancel: () => any;
    originalName: string;
    newName: string;
    folderType?: string;
}

export class ImportWithRenameConfirmModal extends React.Component<Props, any> {
    render() {
        const { onConfirm, onCancel } = this.props;

        return (
            <ConfirmModal
                title="Rename duplicate file?"
                msg={
                    <>
                        <p>
                            A file named <span className="import-rename-filename">{this.props.originalName}</span>{' '}
                            already exists in this {this.props.folderType} folder.
                        </p>
                        <p>
                            To import this file, either give it a new name or it will be renamed to the following on
                            import:
                        </p>
                        <p>
                            <span className="import-rename-filename">{this.props.newName}</span>
                        </p>
                    </>
                }
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant="success"
                confirmButtonText="Import and Rename"
                cancelButtonText="Cancel"
            />
        );
    }
}
