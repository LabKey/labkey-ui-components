import React, { PureComponent } from 'react';

import { Modal } from '../../Modal';

interface Props {
    designerType: string;
    error: any;
    onCancel: () => void;
    onConfirm: () => void;
}

export default class ConfirmImportTypes extends PureComponent<Props> {
    render() {
        const { error, onConfirm, onCancel, designerType } = this.props;

        return (
            <Modal
                title={`Create ${designerType} without importing data?`}
                confirmClass="btn-primary"
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmText="Yes, Create Without Data"
                cancelText="No, Go Back to Field Editor"
            >
                <div>
                    <p>
                        There was an error importing this file. To import this data now, check your file for issues or
                        resolve the error below:
                    </p>
                    <ul>{error && error.errors.map((error, index) => <li key={index}>{error.exception}</li>)}</ul>
                    <p>
                        If you create this {designerType} without resolving the error, no file data will be imported at
                        this time.{' '}
                        <strong>
                            Are you sure you want to create the {designerType} without importing the file data?
                        </strong>
                    </p>
                </div>
            </Modal>
        );
    }
}
