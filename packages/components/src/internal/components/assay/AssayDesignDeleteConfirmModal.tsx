import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

interface Props {
    assayDesignName?: string;
    numRuns?: number;
    onCancel: () => any;
    onConfirm: () => any;
}

export class AssayDesignDeleteConfirmModal extends React.Component<Props, any> {
    static defaultProps = {
        assayDesignName: 'Assay Design',
    };

    render() {
        const { assayDesignName, onConfirm, numRuns, onCancel } = this.props;
        let runsMsg = '';
        if (numRuns) {
            runsMsg = ' and its ' + numRuns + ' run' + (numRuns > 1 ? 's' : '');
        }

        return (
            <ConfirmModal
                title="Permanently delete assay design?"
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Delete"
                cancelButtonText="Cancel"
            >
                <span>
                    {assayDesignName}
                    {runsMsg} will be permanently deleted.
                    <p className="top-spacing">
                        <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                    </p>
                </span>
            </ConfirmModal>
        );
    }
}
