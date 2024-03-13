import React from 'react';

import { PermissionTypes } from '@labkey/api';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { Modal } from '../../Modal';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { Container } from '../base/models/Container';
import { SelectInput } from '../forms/input/SelectInput';

import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { TEST_USER_EDITOR } from '../../userFixtures';

import { EntityMoveConfirmationModal, EntityMoveConfirmationModalProps } from './EntityMoveConfirmationModal';

describe('EntityMoveConfirmationModal', () => {
    function getDefaultProps(): EntityMoveConfirmationModalProps {
        return {
            nounPlural: 'samples',
            onConfirm: jest.fn(),
            currentContainer: TEST_FOLDER_CONTAINER,
        };
    }

    const DEFAULT_APP_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

    test('loading', () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveConfirmationModal {...getDefaultProps()} />,
            undefined,
            DEFAULT_APP_CONTEXT
        );
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain('Loading target projects...');
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveConfirmationModal {...getDefaultProps()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getProjects: () => Promise.reject('This is an error message.'),
                    }),
                }),
            },
            DEFAULT_APP_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain('This is an error message.');
        wrapper.unmount();
    });

    test('no insert perm to any projects', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveConfirmationModal {...getDefaultProps()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getProjects: () =>
                            Promise.resolve([
                                {
                                    ...TEST_PROJECT_CONTAINER,
                                    effectivePermissions: [PermissionTypes.Read],
                                } as Container,
                                {
                                    ...TEST_FOLDER_CONTAINER,
                                    effectivePermissions: [PermissionTypes.Read],
                                } as Container,
                            ]),
                    }),
                }),
            },
            DEFAULT_APP_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain(
            'You do not have permission to move samples to any of the available projects.'
        );
        wrapper.unmount();
    });

    test('has perm to move to another project', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveConfirmationModal {...getDefaultProps()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getProjects: () =>
                            Promise.resolve([
                                {
                                    ...TEST_PROJECT_CONTAINER,
                                    effectivePermissions: [PermissionTypes.Insert],
                                } as Container,
                                {
                                    ...TEST_FOLDER_CONTAINER,
                                    effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
                                } as Container,
                            ]),
                    }),
                }),
            },
            DEFAULT_APP_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput).prop('options').length).toBe(2);
        expect(wrapper.find(SelectInput).prop('options')[0].value).toBe(TEST_PROJECT_CONTAINER.path);
        expect(wrapper.find(SelectInput).prop('options')[0].label).toBe(TEST_PROJECT_CONTAINER.title);
        expect(wrapper.find('textarea')).toHaveLength(1);
        wrapper.unmount();
    });

    test('can move to home project', async () => {
        const wrapper = mountWithAppServerContext(
            <EntityMoveConfirmationModal {...getDefaultProps()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getProjects: () =>
                            Promise.resolve([
                                {
                                    ...TEST_PROJECT_CONTAINER,
                                    path: '/home',
                                    title: 'home',
                                    effectivePermissions: [PermissionTypes.Insert],
                                } as Container,
                                {
                                    ...TEST_FOLDER_CONTAINER,
                                    effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
                                } as Container,
                            ]),
                    }),
                }),
            },
            DEFAULT_APP_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput).prop('options').length).toBe(2);
        expect(wrapper.find(SelectInput).prop('options')[0].value).toBe('/home');
        expect(wrapper.find(SelectInput).prop('options')[0].label).toBe('Home Project');
        expect(wrapper.find(SelectInput).prop('options')[1].value).toBe(TEST_FOLDER_CONTAINER.path);
        expect(wrapper.find(SelectInput).prop('options')[1].label).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('textarea')).toHaveLength(1);
        wrapper.unmount();
    });
});
