import React, { FC, memo } from 'react';

import { FormButtons } from './FormButtons';

interface Props {
    cancelText?: string;
    canConfirm: boolean;
    confirmText?: string;
    confirmingText?: string;
    isConfirming?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ModalButtons: FC<Props> = memo(props => {
    const {
        cancelText = 'Cancel',
        canConfirm,
        confirmText = 'Save',
        confirmingText = 'Saving...',
        isConfirming,
        onCancel,
        onConfirm,
    } = props;
    // Note: This component seems very generic right now, but in a near-future PR we will be introducing our own Modal
    // component, and we will expand this component to have more modal-specific stuff in it at that time.
    return (
        <div className="modal-buttons">
            <FormButtons sticky={false}>
                <button className="btn btn-default" onClick={onCancel} type="button">
                    {cancelText}
                </button>
                <button className="btn btn-success" onClick={onConfirm} type="button" disabled={!canConfirm}>
                    {isConfirming ? confirmingText : confirmText}
                </button>
            </FormButtons>
        </div>
    );
});
