import * as React from "react";
import {Button, Modal} from "react-bootstrap";

interface IDomainConfirm {
    show: boolean
    title: string
    msg: string
    onConfirm: (any) => void
    onCancel: (any) => void
    confirmButtonText: string
    cancelButtonText: string
    confirmVariant: string
}

// TODO move this to @glass/base and rename to ConfirmDialog or ConfirmModal
export default class DomainConfirm extends React.PureComponent<IDomainConfirm, any> {
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
                    <p>{msg}</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsClass='btn btn-light' onClick={onCancel}>{cancelButtonText}</Button>
                    <Button bsClass={'btn btn-' + confirmVariant} onClick={onConfirm}>{confirmButtonText}</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

