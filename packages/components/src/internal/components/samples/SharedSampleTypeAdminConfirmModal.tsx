import React from 'react';
import { getDeleteSharedSampleTypeUrl, getEditSharedSampleTypeUrl } from "./actions";
import { ConfirmModal } from "../base/ConfirmModal";

interface Props {
    sampleTypeId: number
    sampleTypeLabel: string
    onCancel: () => any
    isEdit: boolean
}

export class SharedSampleTypeAdminConfirmModal extends React.Component<Props, any> {

    onConfirm = () => {
        const { sampleTypeId, isEdit } = this.props;
        window.location.href = isEdit ? getEditSharedSampleTypeUrl(sampleTypeId) : getDeleteSharedSampleTypeUrl(sampleTypeId);
    };

    render() {
        const { onCancel, sampleTypeLabel, isEdit } = this.props;

        const verb = isEdit ? 'modified' : 'deleted';
        return (
            <ConfirmModal
                cancelButtonText="Cancel"
                confirmButtonText="Yes, Proceed to LabKey Server"
                onCancel={onCancel}
                onConfirm={this.onConfirm}
                title={'You are about to leave the application, continue?'}
            >
                {`Shared sample type '${sampleTypeLabel}' can only be ${verb} in LabKey Server. Do you want to proceed?`}
            </ConfirmModal>
        )
    }
}
