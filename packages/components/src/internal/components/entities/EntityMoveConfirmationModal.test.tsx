import React from 'react';

import { PermissionTypes } from '@labkey/api';
import { TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { Container } from '../base/models/Container';

import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { TEST_USER_EDITOR } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import {
    EntityMoveConfirmationModal,
    EntityMoveConfirmationModalProps,
    getContainerOptions,
} from './EntityMoveConfirmationModal';
import { act } from '@testing-library/react';

describe('EntityMoveConfirmationModal', () => {
    function getDefaultProps(): EntityMoveConfirmationModalProps {
        return {
            nounPlural: 'samples',
            onConfirm: jest.fn(),
            currentContainer: TEST_FOLDER_CONTAINER,
        };
    }

    const DEFAULT_SERVER_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

    test('error', async () => {
        await act(async () => {
            renderWithAppContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
                serverContext: DEFAULT_SERVER_CONTEXT,
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getContainers: () => Promise.reject('This is an error message.'),
                        }),
                    }),
                },
            });
        });
        expect(document.body.textContent).toContain('This is an error message.');
    });

    test('no insert perm to any conatiners', async () => {
        await act(async () => {
            renderWithAppContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
                serverContext: DEFAULT_SERVER_CONTEXT,
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getContainers: () =>
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
            });
        });
        expect(document.body.textContent).toContain(
            'You do not have permission to move samples to any of the available folders.'
        );
    });

    test('has perm to move to another folder', async () => {
        await act(async () => {
            renderWithAppContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
                serverContext: DEFAULT_SERVER_CONTEXT,
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getContainers: () =>
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
            });
        });

        expect(document.body.querySelector('.select-input__control')).not.toBeNull();
    });
});

describe('getContainerOptions', () => {
    const homeContainer = {
        ...TEST_PROJECT_CONTAINER,
        path: '/home',
        title: 'home',
        effectivePermissions: [PermissionTypes.Insert],
    } as Container;
    const subfolder1Container = {
        ...TEST_FOLDER_CONTAINER,
        effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
    } as Container;
    const subfolder2Container = {
        ...TEST_FOLDER_OTHER_CONTAINER,
        effectivePermissions: [PermissionTypes.Read],
    } as Container;

    const api = getTestAPIWrapper(jest.fn, {
        folder: getFolderTestAPIWrapper(jest.fn, {
            getContainers: () => Promise.resolve([homeContainer, subfolder1Container]),
            getDataTypeExcludedContainers: jest.fn().mockResolvedValue([]),
        }),
    });

    test('with containers excluded', async () => {
        const api_ = getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getContainers: () => Promise.resolve([homeContainer, subfolder1Container, subfolder2Container]),
                getDataTypeExcludedContainers: jest.fn().mockResolvedValue([TEST_FOLDER_OTHER_CONTAINER.id]),
            }),
        });
        const options = await getContainerOptions(api_, TEST_PROJECT_CONTAINER, undefined, false, undefined, undefined);
        expect(options).toStrictEqual([
            {
                label: 'Home Project',
                value: '/home',
                data: homeContainer,
            },
            {
                label: TEST_FOLDER_CONTAINER.title,
                value: TEST_FOLDER_CONTAINER.path,
                data: subfolder1Container,
            },
        ]);
    });

    test('some without permission', async () => {
        const subfolder2Container_ = {
            ...TEST_FOLDER_OTHER_CONTAINER,
            effectivePermissions: [PermissionTypes.Read],
        } as Container;
        const api_ = getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getContainers: () => Promise.resolve([homeContainer, subfolder1Container, subfolder2Container_]),
            }),
        });
        const options = await getContainerOptions(api_, TEST_PROJECT_CONTAINER, undefined, false, undefined, undefined);
        expect(options).toStrictEqual([
            {
                label: 'Home Project',
                value: '/home',
                data: homeContainer,
            },
            {
                label: TEST_FOLDER_CONTAINER.title,
                value: TEST_FOLDER_CONTAINER.path,
                data: subfolder1Container,
            },
        ]);
    });

    test('remove current, exclude some, no permission for some', async () => {
        const subfolder2Container_ = {
            ...TEST_FOLDER_OTHER_CONTAINER,
            effectivePermissions: [PermissionTypes.Read],
        } as Container;
        const api_ = getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getContainers: () => Promise.resolve([homeContainer, subfolder1Container, subfolder2Container_]),
                getDataTypeExcludedContainers: jest.fn().mockResolvedValue([TEST_FOLDER_CONTAINER.id]),
            }),
        });
        const options = await getContainerOptions(api_, TEST_PROJECT_CONTAINER, undefined, true, undefined, undefined);
        expect(options).toStrictEqual([]);
    });

    test('remove current container', async () => {
        const options = await getContainerOptions(api, TEST_PROJECT_CONTAINER, undefined, true, undefined, undefined);

        expect(options).toStrictEqual([
            {
                label: TEST_FOLDER_CONTAINER.title,
                value: TEST_FOLDER_CONTAINER.path,
                data: subfolder1Container,
            },
        ]);
    });

    test('no exclusions', async () => {
        const options = await getContainerOptions(api, TEST_PROJECT_CONTAINER, undefined, false, undefined, undefined);

        expect(options).toStrictEqual([
            {
                label: 'Home Project',
                value: '/home',
                data: homeContainer,
            },
            {
                label: TEST_FOLDER_CONTAINER.title,
                value: TEST_FOLDER_CONTAINER.path,
                data: subfolder1Container,
            },
        ]);
    });
});
