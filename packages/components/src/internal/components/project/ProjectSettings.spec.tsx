import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { ServerContext } from '../base/ServerContext';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { AdminAppContext, AppContext } from '../../AppContext';

import { SampleTypeDataType } from '../entities/constants';

import { ProjectNameSetting } from './ProjectNameSetting';
import { ProjectSettings, ProjectSettingsProps } from './ProjectSettings';

describe('ProjectSettings', () => {
    function getDefaultProps(): ProjectSettingsProps {
        return {
            onChange: jest.fn(),
            onSuccess: jest.fn(),
            onPageError: jest.fn(),
        };
    }

    function getDefaultAppContext(): Partial<AppContext> {
        return {
            admin: {
                projectDataTypes: [SampleTypeDataType],
                sampleTypeDataType: SampleTypeDataType,
            } as AdminAppContext,
            api: getTestAPIWrapper(),
        };
    }

    function getChildServerContext(): Partial<ServerContext> {
        return {
            container: TEST_FOLDER_CONTAINER,
            moduleContext: { query: { isProductProjectsEnabled: true } },
            user: TEST_USER_APP_ADMIN,
        };
    }

    function getHomeServerContext(): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: { query: { isProductProjectsEnabled: true } },
            user: TEST_USER_APP_ADMIN,
        };
    }

    test('Selected project is home', async () => {
        let wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_PROJECT_CONTAINER} />,
            getDefaultAppContext(),
            getHomeServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Dashboard');
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_PROJECT_CONTAINER} />,
            getDefaultAppContext(),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_EDITOR,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_PROJECT_CONTAINER} />,
            getDefaultAppContext(),
            getChildServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Dashboard');
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_PROJECT_CONTAINER} />,
            getDefaultAppContext(),
            {
                container: TEST_FOLDER_CONTAINER,
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Dashboard');
        wrapper.unmount();
    });

    test('permission/type checks', async () => {
        let wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_CONTAINER} />,
            getDefaultAppContext(),
            {
                container: TEST_PROJECT_CONTAINER,
                user: TEST_USER_EDITOR,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(0);
        expect(wrapper.find('.delete-project-button')).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_CONTAINER} />,
            getDefaultAppContext(),
            getChildServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading')).toHaveLength(4);
        expect(wrapper.find('.panel-heading').first().text()).toBe('Settings');
        expect(wrapper.find('.delete-project-button').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.delete-project-button').hostNodes().text()).toBe(' Delete Project');
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_OTHER_CONTAINER} />,
            getDefaultAppContext(),
            getChildServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading')).toHaveLength(4);
        expect(wrapper.find('.panel-heading').first().text()).toBe('Settings');
        expect(wrapper.find('.delete-project-button').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.delete-project-button').hostNodes().text()).toBe(' Delete Project');
        wrapper.unmount();
    });

    test('app without projects', async () => {
        const wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_PROJECT_CONTAINER} />,
            getDefaultAppContext(),
            {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: { query: { isProductProjectsEnabled: false } },
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Dashboard');
        expect(wrapper.find('.delete-project-button')).toHaveLength(0);
        wrapper.unmount();
    });

    test('submits updates for current project', async () => {
        const renameProject = jest.fn();
        const serverCtx = getChildServerContext();
        const { container } = serverCtx;
        const wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_CONTAINER} />,
            {
                ...getDefaultAppContext(),
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        renameProject,
                    }),
                }),
            },
            serverCtx
        );
        await waitForLifecycle(wrapper);
        const properties = wrapper.find(ProjectNameSetting);
        expect(properties.exists()).toBe(true);
        expect(properties.prop('defaultName')).toEqual(container.name);
        expect(properties.prop('defaultTitle')).toEqual(container.title);

        const form = wrapper.find('.project-settings-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);
        expect(renameProject).toHaveBeenCalledWith(
            {
                name: container.name,
                nameAsTitle: false,
                title: container.title,
            },
            '/TestProjectContainer/TestFolderContainer'
        );

        wrapper.unmount();
    });

    test('submits updates for a sibling project', async () => {
        const renameProject = jest.fn();
        const serverCtx = getChildServerContext();
        const wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_OTHER_CONTAINER} />,
            {
                ...getDefaultAppContext(),
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        renameProject,
                    }),
                }),
            },
            serverCtx
        );
        await waitForLifecycle(wrapper);
        const properties = wrapper.find(ProjectNameSetting);
        expect(properties.exists()).toBe(true);
        expect(properties.prop('defaultName')).toEqual(TEST_FOLDER_OTHER_CONTAINER.name);
        expect(properties.prop('defaultTitle')).toEqual(TEST_FOLDER_OTHER_CONTAINER.title);

        const form = wrapper.find('.project-settings-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);
        expect(renameProject).toHaveBeenCalledWith(
            {
                name: TEST_FOLDER_OTHER_CONTAINER.name,
                nameAsTitle: false,
                title: TEST_FOLDER_OTHER_CONTAINER.title,
            },
            '/TestProjectContainer/OtherTestFolderContainer'
        );

        wrapper.unmount();
    });

    test('submits updates from Home project', async () => {
        const renameProject = jest.fn();
        const wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} project={TEST_FOLDER_OTHER_CONTAINER} />,
            {
                ...getDefaultAppContext(),
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        renameProject,
                    }),
                }),
            },
            getHomeServerContext()
        );

        const properties = wrapper.find(ProjectNameSetting);
        expect(properties.exists()).toBe(true);
        expect(properties.prop('defaultName')).toEqual(TEST_FOLDER_OTHER_CONTAINER.name);
        expect(properties.prop('defaultTitle')).toEqual(TEST_FOLDER_OTHER_CONTAINER.title);

        const form = wrapper.find('.project-settings-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);
        expect(renameProject).toHaveBeenCalledWith(
            {
                name: TEST_FOLDER_OTHER_CONTAINER.name,
                nameAsTitle: false,
                title: TEST_FOLDER_OTHER_CONTAINER.title,
            },
            '/TestProjectContainer/OtherTestFolderContainer'
        );

        wrapper.unmount();
    });
});
