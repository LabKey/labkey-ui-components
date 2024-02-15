import React, { FC, memo, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { usePortalRef } from './hooks';
import { ModalButtons, ModalButtonsProps } from './ModalButtons';

interface ModalProps extends Omit<ModalButtonsProps, 'onCancel' | 'onConfirm'> {
    bsSize?: 'lg' | 'sm';
    className?: string;
    // Note: you probably shouldn't use footer, instead use the other props to render the appropriate footer
    footer?: ReactNode;
    onCancel?: () => void;
    onConfirm?: () => void;
    titleNode?: ReactNode;
    titleText?: string;
}

export const Modal: FC<ModalProps> = memo(props => {
    const {
        bsSize,
        cancelText,
        canConfirm,
        children,
        className,
        confirmClass,
        confirmText,
        confirmingText,
        footer,
        isConfirming,
        onCancel,
        onConfirm,
        titleNode,
        titleText,
    } = props;
    const title = titleNode ? titleNode : <h4 className="modal-title">{titleText}</h4>;
    const showButtons = onCancel !== undefined && onConfirm !== undefined;
    const portalRef = usePortalRef('modal');
    const className_ = classNames('modal-dialog', className, {
        'modal-sm': bsSize === 'sm',
        'modal-lg': bsSize === 'lg',
    });
    const modal = (
        <div className="modal-wrapper">
            <div className="fade in modal-backdrop" />

            <div className="lk-modal modal">
                <div className={className_}>
                    <div className="modal-content">
                        <div className="modal-header">
                            {onCancel !== undefined && (
                                <button className="close" onClick={onCancel} type="button">
                                    <span aria-hidden="true">×</span>
                                    <span className="sr-only">Close</span>
                                </button>
                            )}
                            {title}
                        </div>

                        <div className="modal-body">{children}</div>

                        {!footer && showButtons && (
                            <div className="modal-footer">
                                <ModalButtons
                                    cancelText={cancelText}
                                    canConfirm={canConfirm}
                                    confirmClass={confirmClass}
                                    confirmText={confirmText}
                                    confirmingText={confirmingText}
                                    isConfirming={isConfirming}
                                    onConfirm={onConfirm}
                                    onCancel={onCancel}
                                />
                            </div>
                        )}

                        {footer && <div className="modal-footer">{footer}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
    return createPortal(modal, portalRef);
});
Modal.displayName = 'Modal';
