import React, { FC, memo, PropsWithChildren, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { usePortalRef } from './hooks';
import { ModalButtons, ModalButtonsProps } from './ModalButtons';

interface BaseModalProps extends PropsWithChildren {
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
        document.body.classList?.toggle('no-scroll', true);
        return () => {
            document.body.classList?.toggle('no-scroll', false);
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

interface ModalHeaderProps extends PropsWithChildren {
    onCancel?: () => void;
    title: ReactNode;
}
export const ModalHeader: FC<ModalHeaderProps> = ({ children, onCancel, title }) => {
    return (
        <div className="modal-header">
            {onCancel !== undefined && (
                <button className="close" onClick={onCancel} type="button">
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">Close</span>
                </button>
            )}
            {title && <h2 className="modal-title text__wrap">{title}</h2>}
            {children}
        </div>
    );
};
ModalHeader.displayName = 'ModalHeader';

export interface ModalProps extends BaseModalProps, ModalButtonsProps {
    /**
     * Custom footer component. When this is supplied, the default footer interactions will not be rendered.
     * Note: You probably should not use footer, instead use the other props to render the appropriate footer.
     */
    footer?: ReactNode;
    /**
     * Partial content of the default footer rendered by the Modal. It is ignored if a "footer" is supplied.
     */
    footerContent?: ReactNode;
    /**
     * Custom header component. When this is supplied, the default header interactions will not be rendered.
     * Note: You probably should not use header, instead use the other props to render the appropriate header.
     */
    header?: ReactNode;
    /**
     * Title passed to the default header (see ModalHeader). If a custom header is supplied, then this is ignored.
     */
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
        header,
        isConfirming,
        onCancel,
        onCommentChange,
        onConfirm,
        requiresUserComment,
        title,
    } = props;
    const showHeader = !!(onCancel || title);
    return (
        <BaseModal bsSize={bsSize} className={className}>
            {showHeader && !header && <ModalHeader onCancel={onCancel} title={title} />}
            {header}

            <div className="modal-body">{children}</div>

            {!footer && (
                <ModalButtons
                    actionName={actionName}
                    cancelText={cancelText}
                    canConfirm={canConfirm}
                    confirmClass={confirmClass}
                    confirmingText={confirmingText}
                    confirmText={confirmText}
                    isConfirming={isConfirming}
                    onCancel={onCancel}
                    onCommentChange={onCommentChange}
                    onConfirm={onConfirm}
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
