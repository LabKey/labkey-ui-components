import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

interface Props {
    onConfirm: () => any;
    onCancel: () => any;
    numToDelete: number;
}

export class AssayResultDeleteConfirmModal extends React.Component<Props, any> {
    render() {
        const { onConfirm, onCancel, numToDelete } = this.props;

        const noun = numToDelete === 1 ? 'assay result' : 'assay results';

        return (
            <ConfirmModal
                title={'Permanently delete ' + numToDelete + ' ' + noun + '?'}
                msg={
                    <span>
                        The {numToDelete > 1 ? numToDelete : ''} selected {noun} will be permanently deleted.&nbsp;
                        <p className="top-spacing">
                            <strong>Deletion cannot be undone.</strong>
                            &nbsp;Do you want to proceed?
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
