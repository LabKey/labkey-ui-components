import React from 'react';
import { act } from 'react-dom/test-utils';

import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';

import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { FolderAPIWrapper, getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { createMockWithRouterProps } from '../../mockUtils';

import { AppURL } from '../../url/AppURL';

import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { CreateProjectContainer, CreateProjectContainerProps, CreateProjectPage } from './CreateProjectPage';
import {AdminAppContext, AppContext} from "../../AppContext";
import {getTestAPIWrapper} from "../../APIWrapper";
import {ProjectDataTypeSelections} from "./ProjectDataTypeSelections";

describe('CreateProjectPage', () => {
    function getDefaultProps(overrides?: Partial<FolderAPIWrapper>): CreateProjectContainerProps {
        return {
            api: getFolderTestAPIWrapper(jest.fn, overrides),
            onCancel: jest.fn(),
            onCreated: jest.fn(),
        };
    }

    function getDefaultAppContext(admin = {}): Partial<AppContext> {
        return {
            admin: admin as AdminAppContext,
            api: getTestAPIWrapper(),
        };
    }

    const { location } = window;

    beforeAll(() => {
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test('submits data', async () => {
        // Arrange
        const project = TEST_FOLDER_CONTAINER;
        const createProject = jest.fn().mockResolvedValue(project);
        const onCreated = jest.fn();

        // Act
        const wrapper = mountWithAppServerContext(
            <CreateProjectContainer {...getDefaultProps({ createProject })} onCreated={onCreated} />,
            getDefaultAppContext(),
            { moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
        );

        // Assert
        expect(wrapper.find('.panel-heading').text()).toBe('Name of Project');
        expect(wrapper.find(ProjectDataTypeSelections)).toHaveLength(0); // TODO change this to 1 after experimental feature is removed
        const form = wrapper.find('.create-project-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);

        expect(createProject).toHaveBeenCalledWith({
            name: '',
            nameAsTitle: true,
            title: null,
        });
        expect(onCreated).toHaveBeenCalledWith(project);

        wrapper.unmount();
    });

    test('page displays notifications and reroutes', async () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/samplemanager-app.view#',
            }
        );

        const replace = jest.fn();
        const wrapper = mountWithAppServerContext(
            <CreateProjectPage {...createMockWithRouterProps(jest.fn, { replace })} />,
            getDefaultAppContext(),
            { moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT, user: TEST_USER_APP_ADMIN }
        );

        const container = wrapper.find(CreateProjectContainer);
        expect(container.exists()).toBe(true);
        const onCreated = container.prop('onCreated');
        expect(onCreated).toBeDefined();

        act(() => {
            // Simulate creation of a project
            onCreated(TEST_FOLDER_CONTAINER);
        });

        await waitForLifecycle(wrapper);
        expect(replace).toHaveBeenCalledWith(AppURL.create('admin', 'projects').toString());

        wrapper.unmount();
    });
});
