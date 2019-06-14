import * as React from "react";
import {Button, Modal} from "react-bootstrap";

interface Props {
    show: boolean
    title: string
    msg: any
    onConfirm: (any) => void
    onCancel: (any) => void
    confirmButtonText: string
    cancelButtonText: string
    confirmVariant: string
}

export class ConfirmModal extends React.PureComponent<Props, any> {
    static defaultProps = {
        show: true,
        title: 'Confirm',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    };

    render() {
        const { show, title, msg, onConfirm, onCancel, confirmButtonText, cancelButtonText, confirmVariant } = this.props;

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {msg}
                </Modal.Body>

                <Modal.Footer>
                    <Button bsClass='btn btn-light' onClick={onCancel}>{cancelButtonText}</Button>
                    <Button bsClass={'btn btn-' + confirmVariant} onClick={onConfirm}>{confirmButtonText}</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
