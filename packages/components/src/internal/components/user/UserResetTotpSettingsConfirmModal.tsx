/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useState } from 'react';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';

import { ResetTotpResponse, resetTotpSettings } from './actions';
import { useNotificationsContext } from '../notifications/NotificationsContext';

export interface UserResetTotpSettingsConfirmModalProps {
    displayName: string;
    email: string;
    onCancel: () => void;
    onComplete: (response: ResetTotpResponse) => void;
    resetTotpSettingsApi?: (userId: number) => Promise<ResetTotpResponse>;
    userId: number;
}

export const UserResetTotpSettingsConfirmModal: FC<UserResetTotpSettingsConfirmModalProps> = memo(props => {
    const { email, displayName, userId, onCancel, onComplete, resetTotpSettingsApi = resetTotpSettings } = props;
    const [submitting, setSubmitting] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();

    const onConfirm = useCallback(async () => {
        setSubmitting(true);

        try {
            const resp = await resetTotpSettingsApi(userId);
            onComplete({ email, ...resp });
        } catch (e) {
            const error = resolveErrorMessage(e, 'user', 'users', 'update') ?? 'Failed to reset TOTP settings';
            onCancel();
            createNotification({ alertClass: 'danger', message: error }, true);
        } finally {
            setSubmitting(false);
        }
    }, [email, userId, onComplete, resetTotpSettingsApi]);

    return (
        <Modal
            confirmText="Yes, Reset TOTP Settings"
            isConfirming={submitting}
            onCancel={onCancel}
            onConfirm={onConfirm}
            title="Reset TOTP Settings?"
        >
            <p>
                Are you sure you want to reset the TOTP settings for <b>{displayName}</b>?
            </p>
        </Modal>
    );
});

UserResetTotpSettingsConfirmModal.displayName = 'UserResetTotpSettingsConfirmModal';
