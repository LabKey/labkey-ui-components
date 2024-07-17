import React, { FC, memo, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { usePortalRef } from './hooks';
import { ModalButtons, ModalButtonsProps } from './ModalButtons';

interface BaseModalProps {
    bsSize?: 'lg' | 'sm';
    className?: string;
}

/**
 * This component renders the absolute basic elements needed to render a modal. You probably shouldn't use this
 * component, instead you should probably be using Modal, which has a bunch of props to make it easier to render a
 * typical modal with save/close buttons and the appropriate logic for those buttons.
 */
export const BaseModal: FC<BaseModalProps> = ({ bsSize, children, className }) => {
    const portalRef = usePortalRef('modal');
    const className_ = classNames('modal-dialog', className, {
        'modal-sm': bsSize === 'sm',
        'modal-lg': bsSize === 'lg',
    });

    useEffect(() => {
        // Prevent scrolling the body when a modal is shown
        document.body.classList.toggle('no-scroll', true);
        return () => {
            document.body.classList.toggle('no-scroll', false);
        };
    }, []);

    const modal = (
        <div className="modal-wrapper">
            <div className="fade in modal-backdrop" />

            <div className="lk-modal modal">
                <div className={className_}>
                    <div className="modal-content">{children}</div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, portalRef);
};
BaseModal.displayName = 'BaseModal';

interface ModalHeaderProps {
    onCancel?: () => void;
    title: ReactNode;
}
export const ModalHeader: FC<ModalHeaderProps> = ({ title, onCancel }) => {
    return (
        <div className="modal-header">
            {onCancel !== undefined && (
                <button className="close" onClick={onCancel} type="button">
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">Close</span>
                </button>
            )}
            {title && <h4 className="modal-title">{title}</h4>}
        </div>
    );
};
ModalHeader.displayName = 'ModalHeader';

export interface ModalProps extends BaseModalProps, ModalButtonsProps {
    // Note: you probably shouldn't use footer, instead use the other props to render the appropriate footer
    footer?: ReactNode;
    // This is partial content of the default footer rendered by the Modal. It is ignored if a "footer" is supplied.
    footerContent?: ReactNode;
    title?: ReactNode;
}

export const Modal: FC<ModalProps> = memo(props => {
    const {
        actionName,
        bsSize,
        cancelText,
        canConfirm,
        children,
        className,
        confirmClass,
        confirmText,
        confirmingText,
        footer,
        footerContent,
        isConfirming,
        onCancel,
        onCommentChange,
        onConfirm,
        requiresUserComment,
        title,
    } = props;
    const showHeader = onCancel || title;
    return (
        <BaseModal bsSize={bsSize} className={className}>
            {showHeader && <ModalHeader onCancel={onCancel} title={title} />}

            <div className="modal-body">{children}</div>

            {!footer && (
                <ModalButtons
                    actionName={actionName}
                    cancelText={cancelText}
                    canConfirm={canConfirm}
                    confirmClass={confirmClass}
                    confirmText={confirmText}
                    confirmingText={confirmingText}
                    isConfirming={isConfirming}
                    onConfirm={onConfirm}
                    onCommentChange={onCommentChange}
                    onCancel={onCancel}
                    requiresUserComment={requiresUserComment}
                >
                    {footerContent}
                </ModalButtons>
            )}

            {footer && <div className="modal-footer">{footer}</div>}
        </BaseModal>
    );
});
Modal.displayName = 'Modal';
