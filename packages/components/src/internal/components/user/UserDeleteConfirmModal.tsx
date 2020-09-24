import React from 'react';
import { Utils } from '@labkey/api';

import { List } from 'immutable';

import { ConfirmModal } from '../base/ConfirmModal';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

import { deleteUsers } from './actions';

interface Props {
    userIds: List<number>;
    onComplete: (response: any) => any;
    onCancel: () => any;
}

interface State {
    submitting: boolean;
    error: React.ReactNode;
}

export class UserDeleteConfirmModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined,
        };
    }

    onConfirm = () => {
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

    render() {
        const { onCancel, userIds } = this.props;
        const { error, submitting } = this.state;
        const userCount = userIds.size;

        return (
            <ConfirmModal
                title={'Delete ' + Utils.pluralBasic(userCount, 'User') + '?'}
                msg={
                    <>
                        <p>
                            Generally, <b>deactivation of a user is recommended</b>. Deactivated users may not login,
                            but their information will be preserved in case they are reactivated at a later time.
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
                    </>
                }
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Permanently Delete"
                cancelButtonText="Cancel"
                submitting={submitting}
            />
        );
    }
}
