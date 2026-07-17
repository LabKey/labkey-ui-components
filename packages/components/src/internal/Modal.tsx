/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { usePortalRef } from './hooks';
import { ModalButtons, ModalButtonsProps } from './ModalButtons';
import { ModalFooterSlotContext } from './ModalFooterSlot';
import { Key } from '../public/useEnterEscape';

const FOCUSABLE_SELECTORS =
    'a, button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface BaseModalProps extends PropsWithChildren {
    bsSize?: 'lg' | 'sm';
    className?: string;
    onCancel?: () => void;
}

/**
 * This component renders the absolute basic elements needed to render a modal. You probably shouldn't use this
 * component, instead you should probably be using Modal, which has a bunch of props to make it easier to render a
 * typical modal with save/close buttons and the appropriate logic for those buttons.
 */
export const BaseModal: FC<BaseModalProps> = ({ bsSize, children, className, onCancel }) => {
    const portalRef = usePortalRef('modal');
    const modalRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        // Focus the modal on open so keyboard navigation starts within it rather than behind it
        modalRef.current?.focus();
    }, []);

    useEffect(() => {
        // Trap focus within the modal so Tab/Shift+Tab cycle only through modal elements,
        // and close the modal on Escape
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === Key.ESCAPE) {
                onCancel?.();
            } else if (e.key === Key.TAB) {
                const focusable = Array.from(
                    modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
                );
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const modal = (
        <div className="modal-wrapper">
            <div className="fade in modal-backdrop" />

            <div className="lk-modal modal">
                <div className={className_}>
                    <div className="modal-content" ref={modalRef} tabIndex={-1}>
                        {children}
                    </div>
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
     * When true, the Modal renders an empty footer element and provides it to descendants via
     * ModalFooterSlotContext; any FormButtons rendered in the modal body will portal into it (gated on the
     * active FormStep when inside one). Use this when the modal body hosts a form or wizard whose steps render
     * their own buttons (e.g. via WizardNavButtons) that belong in the modal footer. Note this applies to every
     * FormButtons in the body, so don't combine it with body content that renders unrelated inline FormButtons.
     * An explicit "footer" takes precedence over the slot; "footerContent" and the default footer buttons are
     * not rendered when the slot is enabled.
     */
    footerSlot?: boolean;
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
        footerSlot,
        header,
        isConfirming,
        onCancel,
        onCommentChange,
        onConfirm,
        requiresUserComment,
        title,
    } = props;
    const showHeader = !!(onCancel || title);
    const [footerEl, setFooterEl] = useState<HTMLDivElement>(null);
    const footerRef = useCallback((el: HTMLDivElement) => setFooterEl(el), []);
    const slotEnabled = footerSlot && !footer;
    return (
        <BaseModal bsSize={bsSize} className={className} onCancel={onCancel}>
            {/* Always provide a value (undefined when the slot is disabled) so a nested Modal resets the
                context and its own footer buttons never portal into an enclosing Modal's slot. */}
            <ModalFooterSlotContext.Provider value={slotEnabled ? (footerEl ?? null) : undefined}>
                {showHeader && !header && <ModalHeader onCancel={onCancel} title={title} />}
                {header}

                <div className="modal-body">{children}</div>

                {slotEnabled && <div className="modal-footer modal-footer--slot" ref={footerRef} />}

                {!slotEnabled && !footer && (
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

                {!slotEnabled && footer && <div className="modal-footer">{footer}</div>}
            </ModalFooterSlotContext.Provider>
        </BaseModal>
    );
});
Modal.displayName = 'Modal';
