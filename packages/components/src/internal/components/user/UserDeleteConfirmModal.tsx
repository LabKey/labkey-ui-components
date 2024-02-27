import React, { ReactNode } from 'react';
import { Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { deleteUsers } from './actions';

interface Props {
    onCancel: () => any;
    onComplete: (response: any) => any;
    userIds: number[];
}

interface State {
    error: ReactNode;
    submitting: boolean;
}

export class UserDeleteConfirmModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined,
        };
    }

    onConfirm = (): void => {
        const { userIds, onComplete } = this.props;

        this.setState(() => ({ submitting: true }));
        deleteUsers(userIds)
            .then(onComplete)
            .catch(error => {
                console.error(error);
                this.setState(() => ({
                    error: resolveErrorMessage(error, 'user', 'users', 'delete'),
                    submitting: false,
                }));
            });
    };

    render(): ReactNode {
        const { onCancel, userIds } = this.props;
        const { error, submitting } = this.state;
        const userCount = userIds.length;

        return (
            <Modal
                title={'Delete ' + Utils.pluralBasic(userCount, 'User') + '?'}
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmClass="btn-danger"
                confirmText="Yes, Permanently Delete"
                isConfirming={submitting}
            >
                <p>
                    Generally, <b>deactivation of a user is recommended</b>. Deactivated users may not login, but their
                    information will be preserved in case they are reactivated at a later time.
                </p>
                <p>
                    Deletion of a user is <b>permanent and cannot be undone</b>. Deleted users:
                    <ul>
                        <li>will no longer be displayed with actions taken or data uploaded by them</li>
                        <li>will be removed from groups and permissions settings</li>
                        <li>cannot be reactivated</li>
                    </ul>
                </p>
                <p>{Utils.pluralBasic(userCount, 'user')} will be deleted. Do you want to proceed?</p>
                {error && <Alert>{error}</Alert>}
            </Modal>
        );
    }
}
