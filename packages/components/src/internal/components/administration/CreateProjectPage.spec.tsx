import React from 'react';
import { act } from 'react-dom/test-utils';

import { mountWithAppServerContext, mountWithServerContext, waitForLifecycle } from '../../testHelpers';

import { TEST_FOLDER_CONTAINER } from '../../../test/data/constants';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { FolderAPIWrapper, getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { createMockWithRouterProps } from '../../mockUtils';

import { AppURL } from '../../url/AppURL';

import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { CreateProjectContainer, CreateProjectContainerProps, CreateProjectPage } from './CreateProjectPage';

describe('CreateProjectPage', () => {
    function getDefaultProps(overrides?: Partial<FolderAPIWrapper>): CreateProjectContainerProps {
        return {
            api: getFolderTestAPIWrapper(jest.fn, overrides),
            onCancel: jest.fn(),
            onCreated: jest.fn(),
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
        const wrapper = mountWithServerContext(
            <CreateProjectContainer {...getDefaultProps({ createProject })} onCreated={onCreated} />,
            { moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
        );

        // Assert
        const form = wrapper.find('.create-project-form');
        expect(form.exists()).toBe(true);
        form.simulate('submit');

        await waitForLifecycle(wrapper);

        expect(createProject).toHaveBeenCalledWith({
            allowUserSpecifiedNames: true,
            name: '',
            nameAsTitle: true,
            prefix: '',
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
            undefined,
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
