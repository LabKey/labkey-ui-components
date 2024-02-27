import React, { ReactNode } from 'react';
import { Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { updateUsersActiveState } from './actions';

interface Props {
    onCancel: () => any;
    onComplete: (response: any) => any;
    reactivate: boolean;
    userIds: number[];
}

interface State {
    error: React.ReactNode;
    submitting: boolean;
}

export class UserActivateChangeConfirmModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined,
        };
    }

    onConfirm = (): void => {
        const { userIds, reactivate, onComplete } = this.props;

        this.setState(() => ({ submitting: true }));
        updateUsersActiveState(userIds, reactivate)
            .then(onComplete)
            .catch(error => {
                console.error(error);
                this.setState(() => ({
                    error: resolveErrorMessage(error, 'user', 'users', 'update'),
                    submitting: false,
                }));
            });
    };

    render(): ReactNode {
        const { onCancel, userIds, reactivate } = this.props;
        const { error, submitting } = this.state;
        const userCount = userIds.length;
        const action = reactivate ? 'Reactivate' : 'Deactivate';

        return (
            <Modal
                title={action + ' ' + Utils.pluralBasic(userCount, 'User') + '?'}
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmClass={reactivate ? 'btn-success' : 'btn-danger'}
                confirmText={'Yes, ' + action}
                isConfirming={submitting}
            >
                {!reactivate && (
                    <p>
                        Deactivated users will <b>no longer be able to login</b>. However, their information will be
                        preserved for display purposes, and their group memberships and role assignments will be
                        preserved in case they are reactivated at a later time.
                    </p>
                )}
                {reactivate && (
                    <p>
                        Reactivated users will be able to <b>login normally</b>, and all their previous group
                        memberships and role assignments will apply.
                    </p>
                )}
                <p>{Utils.pluralBasic(userCount, 'user')} will be updated. Do you want to proceed?</p>
                {error && <Alert>{error}</Alert>}
            </Modal>
        );
    }
}
