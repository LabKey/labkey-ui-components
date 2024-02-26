import React, { FC, memo } from 'react';

import { Modal } from '../../Modal';

interface Props {
    folderType?: string;
    newName: string;
    onCancel: () => void;
    onConfirm: () => void;
    originalName: string;
}

export const ImportWithRenameConfirmModal: FC<Props> = memo(props => {
    const { folderType, newName, onConfirm, onCancel, originalName } = props;

    return (
        <Modal
            title="Rename duplicate file?"
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="Import and Rename"
        >
            <p>
                A file named <span className="import-rename-filename">{originalName}</span> already exists in this{' '}
                {folderType} folder.
            </p>
            <p>To import this file, either give it a new name or it will be renamed to the following on import:</p>
            <p>
                <span className="import-rename-filename">{newName}</span>
            </p>
        </Modal>
    );
});
