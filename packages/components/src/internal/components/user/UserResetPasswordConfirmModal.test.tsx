/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { UserResetPasswordConfirmModal, UserResetPasswordConfirmModalProps } from './UserResetPasswordConfirmModal';

describe('UserResetPasswordConfirmModal', () => {
    const email = 'jest@localhost.test';
    const userId = 5002;
    const DEFAULT_PROPS: UserResetPasswordConfirmModalProps = {
        email,
        hasLogin: true,
        onCancel: jest.fn(),
        onComplete: jest.fn(),
        resetPasswordApi: jest.fn().mockResolvedValue({ userId, resetPassword: true }),
        userId,
    };

    test('with login', () => {
        renderWithAppContext(<UserResetPasswordConfirmModal {...DEFAULT_PROPS} />);

        expect(document.querySelector('.modal-title').innerHTML).toEqual('Reset Password?');
        expect(document.querySelector('.modal-body').innerHTML).toContain(
            'You are about to clear the current password for'
        );
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('without login', () => {
        renderWithAppContext(<UserResetPasswordConfirmModal {...DEFAULT_PROPS} hasLogin={false} />);

        expect(document.querySelector('.modal-body').innerHTML).toContain('You are about to send');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('with error', async () => {
        const errorMsg = 'Test Error';
        const resetPasswordApi = jest.fn().mockRejectedValue(errorMsg);
        renderWithAppContext(
            <UserResetPasswordConfirmModal {...DEFAULT_PROPS} hasLogin={false} resetPasswordApi={resetPasswordApi} />
        );

        await userEvent.click(document.querySelector('.btn-success'));

        expect(resetPasswordApi).toHaveBeenCalledWith(DEFAULT_PROPS.userId);
        expect(DEFAULT_PROPS.onCancel).toHaveBeenCalled();
    });
});
