import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

import { resetPassword } from './actions';

interface Props {
    email: string;
    hasLogin: boolean;
    onComplete: (response: any) => any;
    onCancel: () => any;
}

interface State {
    submitting: boolean;
    error: React.ReactNode;
}

export class UserResetPasswordConfirmModal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            error: undefined,
        };
    }

    onConfirm = () => {
        const { email, onComplete } = this.props;

        this.setState(() => ({ submitting: true }));
        resetPassword(email)
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
        const { onCancel, hasLogin, email } = this.props;
        const { error, submitting } = this.state;

        return (
            <ConfirmModal
                title="Reset Password?"
                msg={
                    <>
                        {hasLogin ? (
                            <p>
                                You are about to clear the current password for <b>{email}</b>. This will send the user
                                a reset password email and force them to pick a new password to access the site.
                            </p>
                        ) : (
                            <p>
                                You are about to send <b>{email}</b> a reset password email. This will let them pick a
                                password to access the site.
                            </p>
                        )}
                        <p>Do you want to proceed?</p>
                        {error && <Alert>{error}</Alert>}
                    </>
                }
                onConfirm={this.onConfirm}
                onCancel={onCancel}
                confirmVariant="success"
                confirmButtonText="Yes, Reset Password"
                cancelButtonText="Cancel"
                submitting={submitting}
            />
        );
    }
}
