import React, { FC, memo } from 'react';

import classNames from 'classnames';

import { FormButtons } from './FormButtons';

export interface ModalButtonsProps {
    cancelText?: string;
    canConfirm?: boolean;
    confirmClass?: string;
    confirmText?: string;
    confirmingText?: string;
    isConfirming?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ModalButtons: FC<ModalButtonsProps> = memo(props => {
    const {
        cancelText = 'Cancel',
        canConfirm = true,
        confirmClass = 'btn-success',
        confirmText = 'Save',
        confirmingText = 'Saving...',
        isConfirming,
        onCancel,
        onConfirm,
    } = props;
    // Note: This component seems very generic right now, but in a near-future PR we will be introducing our own Modal
    // component, and we will expand this component to have more modal-specific stuff in it at that time.
    const confirmButtonClass = classNames('btn', confirmClass);
    return (
        <div className="modal-buttons">
            <FormButtons sticky={false}>
                <button className="btn btn-default" onClick={onCancel} type="button">
                    {cancelText}
                </button>
                <button
                    className={confirmButtonClass}
                    onClick={onConfirm}
                    type="button"
                    disabled={isConfirming || !canConfirm}
                >
                    {isConfirming ? confirmingText : confirmText}
                </button>
            </FormButtons>
        </div>
    );
});
