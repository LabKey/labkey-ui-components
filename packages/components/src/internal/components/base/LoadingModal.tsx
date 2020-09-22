import React from 'react';
import { Modal } from 'react-bootstrap';

import { LoadingSpinner } from './LoadingSpinner';

interface Props {
    show: boolean;
    title?: string;
    onCancel?: (any) => void;
}

export class LoadingModal extends React.PureComponent<Props, any> {
    static defaultProps = {
        show: true,
        title: 'Loading...',
    };

    render() {
        const { show, title, onCancel } = this.props;

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <LoadingSpinner />
                </Modal.Body>
            </Modal>
        );
    }
}
