import React, { PureComponent } from 'react';

import { ConfirmModal } from '../../..';

interface Props {
    error: any;
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    designerType: string;
}

export default class ConfirmImportTypes extends PureComponent<Props> {
    render() {
        const { error, onConfirm, onCancel, show, designerType } = this.props;

        return (
            <ConfirmModal
                show={show}
                title={`Create ${designerType} without importing data?`}
                confirmVariant="primary"
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmButtonText="Yes, Create Without Data"
                cancelButtonText="No, Go Back to Field Editor"
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
            </ConfirmModal>
        );
    }
}
