import React from 'react';
import { screen, act } from '@testing-library/react';

import {
    TEST_FOLDER_CONTAINER, TEST_FOLDER_CONTAINER_ADMIN,
    TEST_FOLDER_OTHER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER_ADMIN,
    TEST_PROJECT_CONTAINER,
    TEST_PROJECT_CONTAINER_ADMIN
} from '../../containerFixtures';
import {ProjectManagementPage} from "./ProjectManagementPage";
import {renderWithAppContext} from "../../test/reactTestLibraryHelpers";
import {TEST_USER_APP_ADMIN, TEST_USER_PROJECT_ADMIN} from "../../userFixtures";
import {getTestAPIWrapper} from "../../APIWrapper";
import {getFolderTestAPIWrapper} from "../container/FolderAPIWrapper";
import {getSecurityTestAPIWrapper} from "../security/APIWrapper";
import {AdminAppContext} from "../../AppContext";
import {SampleTypeDataType} from "../entities/constants";

describe('ProjectManagementPage', () => {
    beforeAll(() => {
        global.window.scrollTo = jest.fn();
        global.console.error = jest.fn();
    });

    test('no projects, with create perm', async () => {
        await act(async () => {
            renderWithAppContext(<ProjectManagementPage />, {
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
                        }),
                        security: getSecurityTestAPIWrapper(jest.fn, {
                            fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
                        }),
                    }),
                },
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    user: TEST_USER_APP_ADMIN,
                }
            });
        });

        expect(screen.queryByText("Project Settings")).toBeInTheDocument();
        expect(screen.queryByText("View Audit History")).toBeInTheDocument();
        expect(screen.queryByText("Create a Project")).toBeInTheDocument();
        expect(screen.queryByText(TEST_PROJECT_CONTAINER.title)).not.toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_CONTAINER.title)).not.toBeInTheDocument();

        expect(document.querySelector('.alert-warning').textContent).toBe('No projects have been created. Click here to get started.');
    });

    test('no projects, without create perm', async () => {
        await act(async () => {
            renderWithAppContext(<ProjectManagementPage />, {
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
                        }),
                        security: getSecurityTestAPIWrapper(jest.fn, {
                            fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER]),
                        }),
                    }),
                },
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    user: TEST_USER_PROJECT_ADMIN,
                }
            });
        });

        expect(screen.queryByText("Project Settings")).toBeInTheDocument();
        expect(screen.queryByText("View Audit History")).toBeInTheDocument();
        expect(screen.queryByText("Create a Project")).not.toBeInTheDocument();
        expect(screen.queryByText(TEST_PROJECT_CONTAINER.title)).not.toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_CONTAINER.title)).not.toBeInTheDocument();

        expect(document.querySelector('.alert-warning').textContent).toBe('No projects have been created.');
    });

    test('includesChildProject, all admin', async () => {
        await act(async () => {
            renderWithAppContext(<ProjectManagementPage />, {
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN, TEST_FOLDER_CONTAINER_ADMIN, TEST_FOLDER_OTHER_CONTAINER_ADMIN]),
                        }),
                        security: getSecurityTestAPIWrapper(jest.fn, {
                            fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
                        }),
                    }),
                    admin: {
                        projectDataTypes: [SampleTypeDataType],
                        sampleTypeDataType: SampleTypeDataType,
                    } as AdminAppContext,
                },
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    user: TEST_USER_APP_ADMIN,
                }
            });
        });

        expect(screen.getByText("Project Settings")).toBeInTheDocument();
        expect(screen.queryByText("View Audit History")).toBeInTheDocument();
        expect(screen.queryByText("Create a Project")).toBeInTheDocument();

        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(3);
        expect(screen.queryByText(TEST_PROJECT_CONTAINER.title)).toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_CONTAINER.title)).toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_OTHER_CONTAINER.title)).toBeInTheDocument();

        expect(document.querySelector('.alert-warning')).not.toBeInTheDocument();
    });

    test('includesChildProject, not all admin', async () => {
        await act(async () => {
            renderWithAppContext(<ProjectManagementPage />, {
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        folder: getFolderTestAPIWrapper(jest.fn, {
                            getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER_ADMIN, TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER_ADMIN]),
                        }),
                        security: getSecurityTestAPIWrapper(jest.fn, {
                            fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
                        }),
                    }),
                    admin: {
                        projectDataTypes: [SampleTypeDataType],
                        sampleTypeDataType: SampleTypeDataType,
                    } as AdminAppContext,
                },
                serverContext: {
                    container: TEST_PROJECT_CONTAINER,
                    user: TEST_USER_PROJECT_ADMIN,
                }
            });
        });

        expect(screen.getByText("Project Settings")).toBeInTheDocument();
        expect(screen.queryByText("View Audit History")).toBeInTheDocument();
        expect(screen.queryByText("Create a Project")).toBeInTheDocument();

        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(screen.queryByText(TEST_PROJECT_CONTAINER.title)).toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_CONTAINER.title)).not.toBeInTheDocument();
        expect(screen.queryByText(TEST_FOLDER_OTHER_CONTAINER.title)).toBeInTheDocument();

        expect(document.querySelector('.alert-warning')).not.toBeInTheDocument();
    });
});
