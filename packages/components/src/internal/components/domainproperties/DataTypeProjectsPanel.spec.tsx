import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { SampleTypeDataType } from '../entities/constants';
import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';
import { DataTypeSelector } from '../entities/DataTypeSelector';

import { DataTypeProjectsPanelImpl } from './DataTypeProjectsPanel';
import { BasePropertiesPanel } from './BasePropertiesPanel';

describe('DataTypeProjectsPanel', () => {
    const APP_CONTEXT = {
        api: getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, {
                getDataTypeExcludedProjects: jest.fn().mockResolvedValue([]),
                getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
            }),
            query: getQueryTestAPIWrapper(jest.fn, {
                getDataTypeProjectDataCount: jest.fn().mockResolvedValue({}),
            }),
        }),
    };

    const SERVER_CONTEXT = {
        container: TEST_FOLDER_CONTAINER,
        moduleContext: { query: { hasProductProjects: true } },
    };

    test('with a project', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} />,
            APP_CONTEXT,
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper, 50);

        expect(wrapper.find(BasePropertiesPanel).prop('todoIconHelpMsg')).toBe(
            'This section defines which projects use this sample type. You may want to review.'
        );

        expect(wrapper.find(DataTypeSelector)).toHaveLength(1);
        expect(wrapper.find(DataTypeSelector).text()).toBe('Deselect AllTest Folder Container');

        const props = wrapper.find(DataTypeSelector).props();
        expect(props.entityDataType).toBe(SampleTypeDataType);
        expect(props.allDataCounts).toStrictEqual({});
        expect(props.allDataTypes.length).toBe(1);
        expect(props.allDataTypes[0].label).toBe(TEST_FOLDER_CONTAINER.title);
        expect(props.uncheckedEntitiesDB).toStrictEqual([]);

        wrapper.unmount();
    });

    test('with a project, all excluded', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    ...APP_CONTEXT.api,
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getDataTypeExcludedProjects: jest.fn().mockResolvedValue([TEST_FOLDER_CONTAINER.id]),
                        getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    }),
                }),
            },
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper, 50);

        expect(wrapper.find(DataTypeSelector)).toHaveLength(1);
        expect(wrapper.find(DataTypeSelector).text()).toBe('Select AllTest Folder Container');

        const props = wrapper.find(DataTypeSelector).props();
        expect(props.entityDataType).toBe(SampleTypeDataType);
        expect(props.allDataCounts).toStrictEqual({});
        expect(props.allDataTypes.length).toBe(1);
        expect(props.allDataTypes[0].label).toBe(TEST_FOLDER_CONTAINER.title);
        expect(props.uncheckedEntitiesDB).toStrictEqual([TEST_FOLDER_CONTAINER.id]);

        wrapper.unmount();
    });

    test('without project', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    ...APP_CONTEXT.api,
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getDataTypeExcludedProjects: jest.fn().mockResolvedValue([]),
                        getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
                    }),
                }),
            },
            SERVER_CONTEXT
        );
        await waitForLifecycle(wrapper, 50);

        expect(wrapper.find(DataTypeSelector)).toHaveLength(1);
        expect(wrapper.find(DataTypeSelector).text()).toBe('No projects');

        const props = wrapper.find(DataTypeSelector).props();
        expect(props.entityDataType).toBe(SampleTypeDataType);
        expect(props.allDataCounts).toStrictEqual({});
        expect(props.allDataTypes.length).toBe(0);
        expect(props.uncheckedEntitiesDB).toStrictEqual([]);

        wrapper.unmount();
    });

    test('not hasProductProjects', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} />,
            APP_CONTEXT,
            {
                container: TEST_FOLDER_CONTAINER,
                moduleContext: { query: { hasProductProjects: false } },
            }
        );
        await waitForLifecycle(wrapper, 50);

        expect(wrapper.find(DataTypeSelector)).toHaveLength(0);

        wrapper.unmount();
    });
});
