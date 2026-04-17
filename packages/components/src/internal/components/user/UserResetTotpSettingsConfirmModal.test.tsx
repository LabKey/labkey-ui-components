import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import {
    UserResetTotpSettingsConfirmModal,
    UserResetTotpSettingsConfirmModalProps,
} from './UserResetTotpSettingsConfirmModal';

describe('UserResetTotpSettingsConfirmModal', () => {
    const email = 'jest@localhost.test';
    const displayName = 'Jest User';
    const userId = 5002;
    const DEFAULT_PROPS: UserResetTotpSettingsConfirmModalProps = {
        email,
        displayName,
        onCancel: jest.fn(),
        onComplete: jest.fn(),
        resetTotpSettingsApi: jest.fn().mockResolvedValue({ userId, resetTotpSettings: true }),
        userId,
    };

    test('renders confirmation dialog', () => {
        renderWithAppContext(<UserResetTotpSettingsConfirmModal {...DEFAULT_PROPS} />);

        expect(document.querySelector('.modal-title').innerHTML).toEqual('Reset TOTP Settings?');
        expect(document.querySelector('.modal-body').innerHTML).toContain(
            'Are you sure you want to reset the TOTP settings for'
        );
        expect(document.querySelector('.modal-body').innerHTML).toContain(displayName);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('calls resetTotpSettingsApi on confirm', async () => {
        renderWithAppContext(<UserResetTotpSettingsConfirmModal {...DEFAULT_PROPS} />);

        await userEvent.click(document.querySelector('.btn-success'));

        expect(DEFAULT_PROPS.resetTotpSettingsApi).toHaveBeenCalledWith(userId);
        expect(DEFAULT_PROPS.onComplete).toHaveBeenCalled();
    });

    test('with error', async () => {
        const errorMsg = 'Test Error';
        const resetTotpSettingsApi = jest.fn().mockRejectedValue(errorMsg);
        renderWithAppContext(
            <UserResetTotpSettingsConfirmModal {...DEFAULT_PROPS} resetTotpSettingsApi={resetTotpSettingsApi} />
        );

        await userEvent.click(document.querySelector('.btn-success'));

        expect(resetTotpSettingsApi).toHaveBeenCalledWith(DEFAULT_PROPS.userId);
        expect(DEFAULT_PROPS.onCancel).toHaveBeenCalled();
    });
});
