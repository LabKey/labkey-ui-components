import React from 'react';
import { PermissionTypes } from '@labkey/api';

import { TEST_USER_APP_ADMIN, TEST_USER_ASSAY_DESIGNER, TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { User } from './models/User';

import { RequiresPermission } from './Permissions';

const CONTENT = <div className="requires-permission-content" />;
const CONTENT_SELECTOR = 'div.requires-permission-content';

describe('<RequiresPermission/>', () => {
    test('does not have permission', () => {
        // Act
        renderWithAppContext(<RequiresPermission perms={PermissionTypes.Admin}>{CONTENT}</RequiresPermission>, {
            serverContext: { user: TEST_USER_READER },
        });

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(0);
    });
    test('has permission', () => {
        // Act
        renderWithAppContext(<RequiresPermission perms={PermissionTypes.Admin}>{CONTENT}</RequiresPermission>, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(1);
    });
    test('does not have all permissions', () => {
        // Act
        // TEST_USER_ASSAY_DESIGNER does not have PermissionTypes.Delete
        renderWithAppContext(
            <RequiresPermission perms={[PermissionTypes.Delete, PermissionTypes.DesignAssay]}>
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: TEST_USER_ASSAY_DESIGNER } }
        );

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(0);
    });
    test('has all permissions', () => {
        // Act
        renderWithAppContext(
            <RequiresPermission perms={[PermissionTypes.Read, PermissionTypes.Update, PermissionTypes.Delete]}>
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: TEST_USER_EDITOR } }
        );

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(1);
    });
    test('does not have any permissions', () => {
        // Act
        renderWithAppContext(
            <RequiresPermission permissionCheck="any" perms={[PermissionTypes.Update, PermissionTypes.Delete]}>
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: TEST_USER_READER } }
        );

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(0);
    });
    test('has any permissions', () => {
        // Act
        renderWithAppContext(
            <RequiresPermission
                permissionCheck="any"
                perms={[PermissionTypes.Admin, PermissionTypes.Read, PermissionTypes.Insert]}
            >
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: TEST_USER_READER } }
        );

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(1);
    });
    test('respects checkIsAdmin true', () => {
        // Arrange
        const ADMIN_READER = new User({ ...TEST_USER_READER, isAdmin: true });

        // Act
        // "checkIsAdmin" defaults to true
        renderWithAppContext(
            <RequiresPermission permissionCheck="any" perms={[PermissionTypes.Update, PermissionTypes.Delete]}>
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: ADMIN_READER } }
        );

        // Assert
        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(1);
    });
    test('respects checkIsAdmin false', () => {
        // Arrange
        const ADMIN_READER = new User({ ...TEST_USER_READER, isAdmin: true });

        // Act
        renderWithAppContext(
            <RequiresPermission
                checkIsAdmin={false}
                permissionCheck="any"
                perms={[PermissionTypes.Update, PermissionTypes.Delete]}
            >
                {CONTENT}
            </RequiresPermission>,
            { serverContext: { user: ADMIN_READER } }
        );

        expect(document.querySelectorAll(CONTENT_SELECTOR)).toHaveLength(0);
    });
});
