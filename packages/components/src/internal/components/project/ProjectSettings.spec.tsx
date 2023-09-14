import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { ServerContext } from '../base/ServerContext';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { AdminAppContext, AppContext } from '../../AppContext';

import { ProjectNameSetting } from './ProjectNameSetting';
import { ProjectSettings, ProjectSettingsProps } from './ProjectSettings';

describe('ProjectSettings', () => {
    function getDefaultProps(): ProjectSettingsProps {
        return {
            onChange: jest.fn(),
            onSuccess: jest.fn(),
        };
    }

    function getDefaultAppContext(admin = {}): Partial<AppContext> {
        return {
            admin: admin as AdminAppContext,
            api: getTestAPIWrapper(),
        };
    }

    function getServerContext(): Partial<ServerContext> {
        return {
            container: TEST_FOLDER_CONTAINER,
            user: TEST_USER_APP_ADMIN,
        };
    }

    test('permission/type checks', () => {
        let wrapper = mountWithAppServerContext(<ProjectSettings {...getDefaultProps()} />, getDefaultAppContext(), {
            container: TEST_PROJECT_CONTAINER,
            user: TEST_USER_APP_ADMIN,
        });

        expect(wrapper.find('.project-settings')).toHaveLength(0);
        expect(wrapper.find('.delete-project-button')).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(<ProjectSettings {...getDefaultProps()} />, getDefaultAppContext(), {
            container: TEST_FOLDER_CONTAINER,
            user: TEST_USER_EDITOR,
        });

        expect(wrapper.find('.project-settings')).toHaveLength(0);
        expect(wrapper.find('.delete-project-button')).toHaveLength(0);
        wrapper.unmount();

        wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} />,
            getDefaultAppContext(),
            getServerContext()
        );

        expect(wrapper.find('.project-settings')).toHaveLength(1);
        expect(wrapper.find('.panel-heading').text()).toBe('Name of Project');
        expect(wrapper.find('.delete-project-button').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.delete-project-button').hostNodes().text()).toBe(' Delete Project');
        wrapper.unmount();
    });

    test('submits updates', async () => {
        const renameProject = jest.fn();
        const serverCtx = getServerContext();
        const { container } = serverCtx;
        const wrapper = mountWithAppServerContext(
            <ProjectSettings {...getDefaultProps()} />,
            {
                admin: {} as AdminAppContext,
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        renameProject,
                    }),
                }),
            },
            serverCtx
        );

        const properties = wrapper.find(ProjectNameSetting);
        expect(properties.exists()).toBe(true);
        expect(properties.prop('defaultName')).toEqual(container.name);
        expect(properties.prop('defaultTitle')).toEqual(container.title);

        const form = wrapper.find('.project-settings-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);
        expect(renameProject).toHaveBeenCalledWith({
            name: container.name,
            nameAsTitle: false,
            title: container.title,
        });

        wrapper.unmount();
    });
});
