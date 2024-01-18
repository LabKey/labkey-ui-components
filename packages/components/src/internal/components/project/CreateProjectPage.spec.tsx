import React from 'react';
import { act } from 'react-dom/test-utils';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import {
    TEST_FOLDER_CONTAINER,
    TEST_FOLDER_OTHER_CONTAINER,
    TEST_PROJECT_CONTAINER,
    TEST_PROJECT_CONTAINER_ADMIN,
} from '../../containerFixtures';

import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN } from '../../userFixtures';

import { FolderAPIWrapper, getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { AppURL } from '../../url/AppURL';

import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { AdminAppContext, AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';

import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { SampleTypeDataType } from '../entities/constants';

import { CreateProjectContainer, CreateProjectContainerProps, CreateProjectPage } from './CreateProjectPage';
import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

describe('CreateProjectPage', () => {
    function getDefaultProps(overrides?: Partial<FolderAPIWrapper>): CreateProjectContainerProps {
        return {
            api: getFolderTestAPIWrapper(jest.fn, overrides),
            onCancel: jest.fn(),
            onCreated: jest.fn(),
        };
    }

    function getDefaultAppContext(container = TEST_PROJECT_CONTAINER_ADMIN): Partial<AppContext> {
        return {
            admin: {
                projectDataTypes: [],
                ProjectFreezerSelectionComponent: null,
            } as AdminAppContext,
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: () => Promise.resolve([container]),
                }),
            }),
        };
    }

    test('submits data', async () => {
        // Arrange
        const project = TEST_FOLDER_CONTAINER;
        const createProject = jest.fn().mockResolvedValue(project);
        const onCreated = jest.fn();

        // Act
        const wrapper = mountWithAppServerContext(
            <CreateProjectContainer {...getDefaultProps({ createProject })} onCreated={onCreated} />,
            getDefaultAppContext(),
            { moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT, container: TEST_PROJECT_CONTAINER }
        );

        // Assert
        expect(wrapper.find('.panel-heading').first().text()).toBe('Name of Project');
        expect(wrapper.find(ProjectDataTypeSelections)).toHaveLength(1);
        const form = wrapper.find('.create-project-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);

        expect(createProject).toHaveBeenCalledWith(
            {
                name: '',
                nameAsTitle: true,
                title: null,
                disabledSampleTypes: undefined,
                disabledDashboardSampleTypes: undefined,
                disabledDataClasses: undefined,
                disabledAssayDesigns: undefined,
                disabledStorageLocations: undefined,
            },
            TEST_PROJECT_CONTAINER.path
        );
        expect(onCreated).toHaveBeenCalledWith(project);

        wrapper.unmount();
    });

    test('submits data from child', async () => {
        // Arrange
        const project = TEST_FOLDER_CONTAINER;
        const createProject = jest.fn().mockResolvedValue(project);
        const onCreated = jest.fn();

        // Act
        const wrapper = mountWithAppServerContext(
            <CreateProjectContainer {...getDefaultProps({ createProject })} onCreated={onCreated} />,
            getDefaultAppContext(),
            { moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT, container: TEST_FOLDER_OTHER_CONTAINER }
        );

        // Assert
        expect(wrapper.find('.panel-heading').first().text()).toBe('Name of Project');
        expect(wrapper.find(ProjectDataTypeSelections)).toHaveLength(1);
        const form = wrapper.find('.create-project-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);

        expect(createProject).toHaveBeenCalledWith(
            {
                name: '',
                nameAsTitle: true,
                title: null,
                disabledSampleTypes: undefined,
                disabledDashboardSampleTypes: undefined,
                disabledDataClasses: undefined,
                disabledAssayDesigns: undefined,
                disabledStorageLocations: undefined,
            },
            TEST_FOLDER_OTHER_CONTAINER.path
        );
        expect(onCreated).toHaveBeenCalledWith(project);

        wrapper.unmount();
    });

    test('page displays notifications and reroutes', async () => {
        const rrd = require('react-router-dom') as any;
        const mockNavigate = jest.fn();
        rrd.__setNavigate(mockNavigate);
        const wrapper = mountWithAppServerContext(<CreateProjectPage />, getDefaultAppContext(), {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
            user: TEST_USER_APP_ADMIN,
        });
        await waitForLifecycle(wrapper);

        const container = wrapper.find(CreateProjectContainer);
        expect(container.exists()).toBe(true);
        const onCreated = container.prop('onCreated');
        expect(onCreated).toBeDefined();

        act(() => {
            // Simulate creation of a project
            onCreated(TEST_FOLDER_CONTAINER);
        });

        await waitForLifecycle(wrapper);
        expect(mockNavigate).toHaveBeenCalledWith(
            AppURL.create('admin', 'projects').addParam('created', TEST_FOLDER_CONTAINER.name).toString(),
            { replace: true }
        );

        wrapper.unmount();
    });

    test('notAuthorized', async () => {
        const wrapper = mountWithAppServerContext(<CreateProjectPage />, getDefaultAppContext(TEST_PROJECT_CONTAINER), {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
            user: TEST_USER_FOLDER_ADMIN,
        });
        await waitForLifecycle(wrapper);

        expect(wrapper.find(CreateProjectContainer).exists()).toBe(false);
    });

    test('with sampleTypeDataType', async () => {
        const wrapper = mountWithAppServerContext(
            <CreateProjectPage />,
            {
                admin: {
                    projectDataTypes: [],
                    ProjectFreezerSelectionComponent: null,
                    sampleTypeDataType: SampleTypeDataType,
                } as AdminAppContext,
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
                    }),
                }),
            },
            {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.panel-heading')).toHaveLength(3);
        expect(wrapper.find('.panel-heading').at(0).text()).toBe('Name of Project');
        expect(wrapper.find('.panel-heading').at(1).text()).toBe('Data in Project');
        expect(wrapper.find('.panel-heading').at(2).text()).toBe('Dashboard');
        expect(wrapper.find(ProjectDataTypeSelections)).toHaveLength(2);
    });
});
