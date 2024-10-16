import React from 'react';
import { PermissionTypes } from '@labkey/api';

import { render } from '@testing-library/react';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { AppURL } from '../../url/AppURL';

import { EmptyAlert, EmptyAlertWithPermissions } from './EmptyAlert';

const EMPTY_ALERT = 'div.empty-alert';

describe('EmptyAlert', () => {
    test('required props only', () => {
        // Arrange
        const expectedMessage = 'I have a message for you';

        // Act
        render(<EmptyAlert message={expectedMessage} />);

        // Assert
        expect(document.querySelector(EMPTY_ALERT).textContent).toEqual(expectedMessage);
    });
    test('displays action link', () => {
        // Arrange
        const actionURL = AppURL.create('who', 'done', 'it');
        const expectedMessage = 'I have a message for you';

        // Act
        render(<EmptyAlert actionURL={actionURL} message={expectedMessage} />);

        // Assert
        // Should not display link unless action is allowed
        expect(document.querySelector(EMPTY_ALERT).textContent).toEqual(expectedMessage);
    });
    test('allowAction', () => {
        // Arrange
        const actionURL = AppURL.create('who', 'done', 'it');
        const expectedMessage = 'I have a message for you';

        // Act
        render(<EmptyAlert actionURL={actionURL} message={expectedMessage} allowAction />);

        // Assert
        // Should display action link
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(actionURL.toHref());
    });
});

describe('EmptyAlertWithPermissions', () => {
    test('respect allowAction and user', () => {
        // Arrange
        const actionURL = AppURL.create('over', 'the', 'rainbow');
        const expectedMessage = 'Permission granted';
        const expectedPermission = PermissionTypes.Insert;

        // Act
        render(
            <EmptyAlertWithPermissions
                actionURL={actionURL}
                permission={expectedPermission}
                message={expectedMessage}
                user={TEST_USER_READER}
            />
        );

        // Assert
        // Should not display action link when user is not provided
        expect(document.querySelector(EMPTY_ALERT).textContent).toEqual(expectedMessage);
    });
    test('editor', () => {
        // Arrange
        const actionURL = AppURL.create('over', 'the', 'rainbow');
        const expectedMessage = 'Permission granted';
        const expectedPermission = PermissionTypes.Insert;

        // Act
        render(
            <EmptyAlertWithPermissions
                actionURL={actionURL}
                permission={expectedPermission}
                message={expectedMessage}
                user={TEST_USER_EDITOR}
            />
        );
        // Assert
        // Should display action link for editor
        expect(document.querySelector(`${EMPTY_ALERT} a`).getAttribute('href')).toEqual(actionURL.toHref());
    });
});
