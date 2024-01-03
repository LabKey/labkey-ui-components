import React from 'react';

import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { ServerContext } from '../base/ServerContext';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper, Summary } from '../security/APIWrapper';

import { AppContext } from '../../AppContext';

import { Progress } from '../base/Progress';

import { Alert } from '../base/Alert';

import { DeleteProjectModal } from './DeleteProjectModal';

describe('ProjectSettings', () => {
    const DEFAULT_PROPS = {
        projectName: 'ProjName1',
        onCancel: jest.fn(),
        onError: jest.fn(),
    };

    function getServerContext(): Partial<ServerContext> {
        return {
            container: TEST_FOLDER_CONTAINER,
            user: TEST_USER_APP_ADMIN,
        };
    }

    function getAppContextWithMockResolvedValue(value: Summary[]): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getDeletionSummaries: jest.fn().mockResolvedValue(value),
                    deleteContainer: jest.fn().mockResolvedValue({}),
                }),
            }),
        };
    }

    function getAppContextWithMockRejectedValue(error: string): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    getDeletionSummaries: jest.fn().mockRejectedValue(error),
                    deleteContainer: jest.fn().mockResolvedValue({}),
                }),
            }),
        };
    }

    test('Loading summaries', () => {
        const wrapper = mountWithAppServerContext(<DeleteProjectModal {...DEFAULT_PROPS} />, {}, getServerContext());

        expect(wrapper.find(LoadingSpinner).length).toBe(1);
        expect(wrapper.find(Alert).length).toBe(0);
        expect(wrapper.find({ children: 'This project and all of its data will be permanently deleted.' }).length).toBe(
            1
        );
        expect(wrapper.find('button').last().prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('Error loading summaries', async () => {
        const wrapper = mountWithAppServerContext(
            <DeleteProjectModal {...DEFAULT_PROPS} />,
            getAppContextWithMockRejectedValue('Error loading!'),
            getServerContext()
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Alert).length).toBe(1);
        expect(wrapper.find('button').last().prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('Empty summary result', async () => {
        const wrapper = mountWithAppServerContext(
            <DeleteProjectModal {...DEFAULT_PROPS} />,
            getAppContextWithMockResolvedValue([]),
            getServerContext()
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Alert).length).toBe(0);
        expect(
            wrapper.find({ children: 'This project will be permanently deleted. It contains no data.' }).length
        ).toBe(1);
        expect(wrapper.find('button').last().prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('Populated summary result', async () => {
        const wrapper = mountWithAppServerContext(
            <DeleteProjectModal {...DEFAULT_PROPS} />,
            getAppContextWithMockResolvedValue([{ count: 1, noun: 'Item' }]),
            getServerContext()
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Alert).length).toBe(0);
        expect(wrapper.find({ children: 'This project and all of its data will be permanently deleted.' }).length).toBe(
            1
        );
        expect(
            wrapper.find({
                children:
                    'Before deleting this project, ensure there are no references to data (samples, sources or registry, assay data, etc.) in other projects.',
            }).length
        ).toBe(1);
        expect(wrapper.find('.delete-project-modal__table').length).toBe(1);
        expect(wrapper.find('button').last().prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('Loading bar while deleting', async () => {
        const wrapper = mountWithAppServerContext(
            <DeleteProjectModal {...DEFAULT_PROPS} />,
            getAppContextWithMockResolvedValue([]),
            getServerContext()
        );

        wrapper.find('button').last().simulate('click');
        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Progress).length).toBe(1);
        expect(wrapper.find({ children: "Please don't close this page until deletion is complete." }).length).toBe(1);
        expect(wrapper.find('button').length).toBe(0);

        wrapper.unmount();
    });
});
