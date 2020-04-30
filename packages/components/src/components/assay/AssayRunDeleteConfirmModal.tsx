import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

interface Props {
    onConfirm: () => any;
    onCancel: () => any;
    numToDelete: number;
}

export class AssayRunDeleteConfirmModal extends React.Component<Props, any> {
    render() {
        const { onConfirm, onCancel, numToDelete } = this.props;

        const noun = numToDelete === 1 ? ' assay run' : ' assay runs';

        return (
            <ConfirmModal
                title={'Permanently delete ' + numToDelete + noun + '?'}
                msg={
                    <span>
                        The entirety of the {numToDelete > 1 ? numToDelete : ''} selected {noun} and any of{' '}
                        {numToDelete === 1 ? 'its' : 'their'} previously replaced versions will be permanently
                        deleted.&nbsp;
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
