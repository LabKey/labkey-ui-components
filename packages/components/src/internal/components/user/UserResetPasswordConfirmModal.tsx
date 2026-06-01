/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useState } from 'react';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { resetPassword, ResetPasswordResponse } from './actions';
import { useNotificationsContext } from '../notifications/NotificationsContext';

export interface UserResetPasswordConfirmModalProps {
    email: string;
    hasLogin: boolean;
    onCancel: () => void;
    onComplete: (response: ResetPasswordResponse) => void;
    resetPasswordApi?: (userId: number) => Promise<ResetPasswordResponse>;
    userId: number;
}

export const UserResetPasswordConfirmModal: FC<UserResetPasswordConfirmModalProps> = memo(props => {
    const { email, userId, hasLogin, onCancel, onComplete, resetPasswordApi = resetPassword } = props;
    const { createNotification } = useNotificationsContext();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const onConfirm = useCallback(async () => {
        setSubmitting(true);

        try {
            const response = await resetPasswordApi(userId);
            onComplete({ email, ...response });
        } catch (e) {
            const error = resolveErrorMessage(e, 'user', 'users', 'reset') ?? 'Failed to reset Password.';
            onCancel();
            createNotification({ alertClass: 'danger', message: error }, true);
        } finally {
            setSubmitting(false);
        }
    }, [userId, onComplete, resetPasswordApi]);

    return (
        <Modal
            confirmText="Yes, Reset Password"
            isConfirming={submitting}
            onCancel={onCancel}
            onConfirm={onConfirm}
            title="Reset Password?"
        >
            {hasLogin ? (
                <p>
                    You are about to clear the current password for <b>{email}</b>. This will send the user a reset
                    password email and force them to pick a new password to access the site.
                </p>
            ) : (
                <p>
                    You are about to send <b>{email}</b> a reset password email. This will let them pick a password to
                    access the site.
                </p>
            )}
            <p>Do you want to proceed?</p>
        </Modal>
    );
});

UserResetPasswordConfirmModal.displayName = 'UserResetPasswordConfirmModal';
