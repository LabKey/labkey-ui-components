import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { waitForLifecycle } from '../../test/enzymeTestHelpers';
import { SampleTypeDataType } from '../entities/constants';
import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';
import { DataTypeSelector } from '../entities/DataTypeSelector';

import { DataTypeProjectsPanelImpl } from './DataTypeProjectsPanel';
import { BasePropertiesPanel } from './BasePropertiesPanel';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

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

    const DEFAULT_PROPS = {
        collapsed: false,
        controlledCollapse: true,
        togglePanel: jest.fn(),
    };

    test('with a project', async () => {
        renderWithAppContext(
            <DataTypeProjectsPanelImpl
                entityDataType={SampleTypeDataType}
                onUpdateExcludedProjects={jest.fn()}
                {...DEFAULT_PROPS}
            />, {
                appContext: APP_CONTEXT,
                serverContext: SERVER_CONTEXT
            }
        );

        await waitFor(() => {
            expect(document.querySelector(".row")).toBeInTheDocument();
        });

        const folderOptions = document.querySelectorAll('.folder-datatype-faceted__value');
        expect(folderOptions).toHaveLength(1);

        expect(folderOptions.item(0).textContent).toBe(TEST_FOLDER_CONTAINER.title);
    });

    // test('with a project, all excluded', async () => {
    //     renderWithAppContext(
    //         <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} {...DEFAULT_PROPS} />,
    //         {
    //             appContext: {
    //                 api: getTestAPIWrapper(jest.fn, {
    //                 ...APP_CONTEXT.api,
    //                 folder: getFolderTestAPIWrapper(jest.fn, {
    //                     getDataTypeExcludedProjects: jest.fn().mockResolvedValue([TEST_FOLDER_CONTAINER.id]),
    //                     getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
    //                 }),
    //             })},
    //             serverContext: SERVER_CONTEXT,
    //         },
    //     );
    //
    //     await waitFor(() => {
    //         expect(document.querySelector(".rowX").textContent).toBe("X");//.toBeInTheDocument();
    //     });
    //
    //     const folderOptions = document.querySelectorAll('.folder-datatype-faceted__value');
    //     expect(folderOptions).toHaveLength(0);
    //
    //     expect(wrapper.find(DataTypeSelector)).toHaveLength(1);
    //     expect(wrapper.find(DataTypeSelector).text()).toBe('Select AllTest Folder Container');
    //
    //     const props = wrapper.find(DataTypeSelector).props();
    //     expect(props.entityDataType).toBe(SampleTypeDataType);
    //     expect(props.allDataCounts).toStrictEqual({});
    //     expect(props.allDataTypes.length).toBe(1);
    //     expect(props.allDataTypes[0].label).toBe(TEST_FOLDER_CONTAINER.title);
    //     expect(props.uncheckedEntitiesDB).toStrictEqual([TEST_FOLDER_CONTAINER.id]);
    //
    // });
    //
    // test('without project', async () => {
    //     renderWithAppContext(
    //         <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} {...DEFAULT_PROPS} />,
    //         {
    //             appContext: {
    //                 api: getTestAPIWrapper(jest.fn, {
    //                     ...APP_CONTEXT.api,
    //                     folder: getFolderTestAPIWrapper(jest.fn, {
    //                         getDataTypeExcludedProjects: jest.fn().mockResolvedValue([]),
    //                         getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
    //                     }),
    //                 })
    //             },
    //             serverContext: SERVER_CONTEXT
    //         },
    //     );
    //     await waitForLifecycle(wrapper, 50);
    //
    //     expect(wrapper.find(DataTypeSelector)).toHaveLength(1);
    //     expect(wrapper.find(DataTypeSelector).text()).toBe('No projects');
    //
    //     const props = wrapper.find(DataTypeSelector).props();
    //     expect(props.entityDataType).toBe(SampleTypeDataType);
    //     expect(props.allDataCounts).toStrictEqual({});
    //     expect(props.allDataTypes.length).toBe(0);
    //     expect(props.uncheckedEntitiesDB).toStrictEqual([]);
    //
    // });
    //
    // test('not hasProductProjects', async () => {
    //     renderWithAppContext(
    //         <DataTypeProjectsPanelImpl entityDataType={SampleTypeDataType} onUpdateExcludedProjects={jest.fn()} {...DEFAULT_PROPS}/>,
    //         {
    //             appContext: APP_CONTEXT,
    //             serverContext:
    //                 {
    //                     container: TEST_FOLDER_CONTAINER,
    //                     moduleContext: {query: {hasProductProjects: false}},
    //                 }
    //         }
    //     );
    //     await waitForLifecycle(wrapper, 50);
    //
    //     expect(wrapper.find(DataTypeSelector)).toHaveLength(0);
    //
    // });
    //
    // test('with a project and related exclusion type', async () => {
    //     renderWithAppContext(
    //         <DataTypeProjectsPanelImpl
    //             entityDataType={SampleTypeDataType}
    //             relatedDataTypeLabel="Include in Dashboard"
    //             relatedProjectConfigurableDataType="DashboardSampleType"
    //             onUpdateExcludedProjects={jest.fn()}
    //             {...DEFAULT_PROPS}
    //         />,
    //         {
    //             appContext: {
    //                 api: getTestAPIWrapper(jest.fn, {
    //                     ...APP_CONTEXT.api,
    //                     folder: getFolderTestAPIWrapper(jest.fn, {
    //                         getDataTypeExcludedProjects: jest.fn().mockResolvedValue([]),
    //                         getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
    //                     }),
    //                 })
    //             },
    //             serverContext: SERVER_CONTEXT,
    //         },
    //     );
    //     await waitForLifecycle(wrapper, 50);
    //
    //     expect(wrapper.find(DataTypeSelector)).toHaveLength(2);
    //     expect(wrapper.find(DataTypeSelector).first().text()).toBe(
    //         'Include in ProjectsDeselect AllTest Folder Container'
    //     );
    //     expect(wrapper.find(DataTypeSelector).last().text()).toBe(
    //         'Include in DashboardDeselect AllTest Project ContainerTest Folder Container'
    //     );
    //
    // });
    //
    // test('with a project and related exclusion type, all excluded', async () => {
    //     renderWithAppContext(
    //         <DataTypeProjectsPanelImpl
    //             entityDataType={SampleTypeDataType}
    //             relatedDataTypeLabel="Include in Dashboard"
    //             relatedProjectConfigurableDataType="DashboardSampleType"
    //             onUpdateExcludedProjects={jest.fn()}
    //             {...DEFAULT_PROPS}
    //         />,
    //         {
    //            appContext: {
    //                api: getTestAPIWrapper(jest.fn, {
    //                    ...APP_CONTEXT.api,
    //                    folder: getFolderTestAPIWrapper(jest.fn, {
    //                        getDataTypeExcludedProjects: jest.fn().mockResolvedValue([TEST_FOLDER_CONTAINER.id]),
    //                        getProjects: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
    //                    }),
    //                })
    //            },
    //             serverContext: SERVER_CONTEXT
    //         },
    //     );
    //     await waitForLifecycle(wrapper, 50);
    //
    //     expect(wrapper.find(DataTypeSelector)).toHaveLength(2);
    //     expect(wrapper.find(DataTypeSelector).first().text()).toBe(
    //         'Include in ProjectsSelect AllTest Folder Container'
    //     );
    //     expect(wrapper.find(DataTypeSelector).last().text()).toBe(
    //         'Include in DashboardSelect AllTest Project Container'
    //     );
    //
    // });
});
