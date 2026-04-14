import React, { FC, memo, useCallback, useState } from 'react';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { ResetTotpResponse, resetTotpSettings } from './actions';

export interface UserResetTotpSettingsConfirmModalProps {
    email: string;
    displayName: string;
    onCancel: () => void;
    onComplete: (response: ResetTotpResponse) => void;
    resetTotpSettingsApi?: (userId: number) => Promise<ResetTotpResponse>;
    userId: number;
}

export const UserResetTotpSettingsConfirmModal: FC<UserResetTotpSettingsConfirmModalProps> = memo(props => {
    const { email, displayName, userId, onCancel, onComplete, resetTotpSettingsApi = resetTotpSettings } = props;
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const onConfirm = useCallback(async () => {
        setSubmitting(true);

        try {
            const resp = await resetTotpSettingsApi(userId);
            onComplete({email, ...resp});
        } catch (e) {
            setError(resolveErrorMessage(e, 'user', 'users', 'update') ?? 'Failed to reset TOTP settings');
        } finally {
            setSubmitting(false);
        }
    }, [email, userId, onComplete, resetTotpSettingsApi]);

    return (
        <Modal
            title="Reset TOTP Settings?"
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="Yes, Reset TOTP Settings"
            isConfirming={submitting}
        >
            <p>Are you sure you want to reset the TOTP settings for <b>{displayName}</b>?</p>
            {error && <Alert>{error}</Alert>}
        </Modal>
    );
});

UserResetTotpSettingsConfirmModal.displayName = 'UserResetTotpSettingsConfirmModal';
