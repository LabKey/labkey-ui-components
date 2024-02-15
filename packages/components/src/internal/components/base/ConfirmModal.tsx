/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { ReactNode } from 'react';
import { Modal, Sizes } from 'react-bootstrap';
import classNames from 'classnames';

export interface ConfirmModalProps {
    backdrop?: string;
    canConfirm?: boolean;
    cancelButtonText?: string;
    confirmButtonText?: string;
    confirmVariant?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
    show?: boolean;
    size?: Sizes;
    submitting?: boolean;
    title?: ReactNode;
}

/**
 *  @deprecated use @labkey/components Modal
 */
export class ConfirmModal extends React.PureComponent<ConfirmModalProps> {
    static defaultProps = {
        show: true,
        title: 'Confirm',
        confirmButtonText: 'Yes',
        canConfirm: true,
        cancelButtonText: 'No', // TODO: 100% of usages override this value, 90% of usages have this set to "Cancel", change the default.
        confirmVariant: 'danger',
    };

    render(): ReactNode {
        const {
            backdrop,
            children,
            show,
            title,
            onConfirm,
            onCancel,
            confirmButtonText,
            cancelButtonText,
            confirmVariant,
            size,
            submitting,
            canConfirm,
        } = this.props;
        const cancelBtnClass = classNames({ 'pull-left': onConfirm !== undefined });
        return (
            <Modal backdrop={backdrop} bsSize={size} show={show} onHide={onCancel}>
                <Modal.Header closeButton={!!onCancel}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>{children}</Modal.Body>

                <Modal.Footer>
                    {onCancel && (
                        <button
                            className={`${cancelBtnClass} btn btn-default`}
                            disabled={submitting}
                            onClick={onCancel}
                            type="button"
                        >
                            {cancelButtonText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            className={`btn btn-${confirmVariant}`}
                            disabled={!canConfirm || submitting}
                            onClick={onConfirm}
                            type="button"
                        >
                            {confirmButtonText}
                        </button>
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
}
