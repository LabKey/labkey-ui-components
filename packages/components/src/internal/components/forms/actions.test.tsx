import { PermissionTypes } from '@labkey/api';
import React, { FC } from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { LoadingState } from '../../../public/LoadingState';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { UsersLoader, useUsersWithPermissions } from './actions';

// Tested components
describe('useUsersWithPermissions', () => {
    interface TestComponentProps {
        containerPath: string;
        loader: UsersLoader;
        permissions: string | string[];
    }

    const TestComponent: FC<TestComponentProps> = ({ containerPath, permissions, loader }) => {
        const { error, loadingState, users } = useUsersWithPermissions(permissions, containerPath, loader);
        return (
            <div>
                {loadingState !== LoadingState.LOADED && <LoadingSpinner />}
                {loadingState === LoadingState.LOADED && users !== undefined && (
                    <div className="users-list">
                        {users.map(user => (
                            <div className="users-list__user" key={user.id}>
                                {user.displayName}
                            </div>
                        ))}
                    </div>
                )}
                {loadingState === LoadingState.LOADED && error !== undefined && (
                    <div className="users-error">{error}</div>
                )}
            </div>
        );
    };

    test('without error', async () => {
        const loader = jest.fn().mockResolvedValue([TEST_USER_EDITOR, TEST_USER_READER]);
        render(<TestComponent containerPath="/" permissions={[PermissionTypes.Read]} loader={loader} />);
        expect(document.querySelectorAll('.fa-spinner').length).toBe(1);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toBe(0);
        });

        expect(document.querySelectorAll('.users-list__user')[0].textContent).toEqual(TEST_USER_EDITOR.displayName);
        expect(document.querySelectorAll('.users-list__user')[1].textContent).toEqual(TEST_USER_READER.displayName);
    });

    test('with error', async () => {
        const error = 'There was a problem retrieving users with the given permissions';
        const loader = () => {
            throw error;
        };
        render(<TestComponent containerPath="/" permissions={[PermissionTypes.Read]} loader={loader} />);

        await waitFor(() => {
            expect(document.querySelector('.users-error').textContent).toBe(error);
        });
    });

    test('reader permissions', async () => {
        const containerPath = '/';
        const loader = jest.fn().mockResolvedValue([TEST_USER_EDITOR, TEST_USER_READER]);
        render(<TestComponent containerPath={containerPath} permissions={[PermissionTypes.Read]} loader={loader} />);
        expect(document.querySelectorAll('.fa-spinner').length).toBe(1);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toBe(0);
        });

        expect(loader).toHaveBeenCalledWith([PermissionTypes.Read], containerPath);
    });

    test('editor permissions', async () => {
        const containerPath = '/';
        const loader = jest.fn().mockResolvedValue([TEST_USER_EDITOR, TEST_USER_READER]);
        render(
            <TestComponent
                containerPath={containerPath}
                permissions={[PermissionTypes.Delete, PermissionTypes.Update]}
                loader={loader}
            />
        );
        expect(document.querySelectorAll('.fa-spinner').length).toBe(1);
        await waitFor(() => {
            expect(document.querySelectorAll('.fa-spinner').length).toBe(0);
        });

        expect(loader).toHaveBeenCalledWith([PermissionTypes.Delete, PermissionTypes.Update], containerPath);
    });
});
