import React from 'react';
import { List } from 'immutable';
import { Utils } from '@labkey/api';

import { ConfirmModal } from '../base/ConfirmModal';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

import { updateUsersActiveState } from './actions';

interface Props {
    userIds: List<number>;
    reactivate: boolean;
    onComplete: (response: any) => any;
    onCancel: () => any;
}

interface State {
    submitting: boolean;
    error: React.ReactNode;
}

export class UserActivateChangeConfirmModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined,
        };
    }

    onConfirm = () => {
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

    render() {
        const { onCancel, userIds, reactivate } = this.props;
        const { error, submitting } = this.state;
        const userCount = userIds.size;
        const action = reactivate ? 'Reactivate' : 'Deactivate';

        return (
            <ConfirmModal
                title={action + ' ' + Utils.pluralBasic(userCount, 'User') + '?'}
                msg={
                    <>
                        {!reactivate && (
                            <p>
                                Deactivated users will <b>no longer be able to login</b>. However, their information
                                will be preserved for display purposes, and their group memberships and role assignments
                                will be preserved in case they are reactivated at a later time.
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
                    </>
                }
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmVariant={reactivate ? 'success' : 'danger'}
                confirmButtonText={'Yes, ' + action}
                cancelButtonText="Cancel"
                submitting={submitting}
            />
        );
    }
}
