import React from 'react';
import { ReactWrapper } from 'enzyme';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';

import { LoadingPage } from '../internal/components/base/LoadingPage';
import { NotFound } from '../internal/components/base/NotFound';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../internal/components/picklist/constants';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { Page } from '../internal/components/base/Page';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

import { SchemaQuery } from '../public/SchemaQuery';

import { getTestAPIWrapper } from '../internal/APIWrapper';

import { Picklist } from '../internal/components/picklist/models';

import { getPicklistTestAPIWrapper } from '../internal/components/picklist/APIWrapper';

import { PicklistOverview, PicklistOverviewImpl, PicklistOverviewWithQueryModels } from './PicklistOverview';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';

const MULTI_SAMPLE_TYPE_PICKLIST = new Picklist({
    listId: 1,
    name: 'Test Picklist 1',
    Description: 'desc 1',
    CreatedBy: 1100,
    Category: PUBLIC_PICKLIST_CATEGORY,
    sampleTypes: ['type1', 'type2'],
});

const SINGLE_SAMPLE_TYPE_PICKLIST = new Picklist({
    listId: 2,
    name: 'Test Picklist 2',
    Description: 'desc 2',
    CreatedBy: 1100,
    Category: PUBLIC_PICKLIST_CATEGORY,
    sampleTypes: ['type1'],
});

describe('PicklistOverview', () => {
    const DEFAULT_PROPS = {
        user: TEST_USER_EDITOR,
        navigate: jest.fn,
        params: { id: 1 },
    };

    function validate(wrapper: ReactWrapper, loading = false, notfound = false, noperm = false): void {
        expect(wrapper.find(LoadingPage)).toHaveLength(loading ? 1 : 0);
        expect(wrapper.find(NotFound)).toHaveLength(notfound ? 1 : 0);
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(noperm ? 1 : 0);
        expect(wrapper.find(PicklistOverviewWithQueryModels)).toHaveLength(!loading && !notfound && !noperm ? 1 : 0);
    }

    test('picklist with multiple sample types', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () => Promise.resolve(MULTI_SAMPLE_TYPE_PICKLIST),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);

        const queryConfigs = Object.values(wrapper.find(PicklistOverviewWithQueryModels).prop('queryConfigs'));
        expect(queryConfigs.length).toBe(3);
        expect(queryConfigs[0].title).toBe('All Samples');
        expect(queryConfigs[0].schemaQuery.toString()).toBe('lists|' + MULTI_SAMPLE_TYPE_PICKLIST.name + '|');
        expect(queryConfigs[1].title).toBe('type1');
        expect(queryConfigs[1].schemaQuery.toString()).toBe('samples|type1|');
        expect(queryConfigs[1].baseFilters.length).toBe(1);
        expect(queryConfigs[1].baseFilters[0].getURLParameterName()).toBe('query.RowId~picklistsamples');
        expect(queryConfigs[1].baseFilters[0].getValue()).toBe('Test Picklist 1');
        expect(queryConfigs[2].title).toBe('type2');
        expect(queryConfigs[2].schemaQuery.toString()).toBe('samples|type2|');
        expect(queryConfigs[2].baseFilters.length).toBe(1);
        expect(queryConfigs[2].baseFilters[0].getURLParameterName()).toBe('query.RowId~picklistsamples');
        expect(queryConfigs[2].baseFilters[0].getValue()).toBe('Test Picklist 1');
    });

    test('picklist with single sample type', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () => Promise.resolve(SINGLE_SAMPLE_TYPE_PICKLIST),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);

        const queryConfigs = Object.values(wrapper.find(PicklistOverviewWithQueryModels).prop('queryConfigs'));
        expect(queryConfigs.length).toBe(2);
        expect(queryConfigs[0].title).toBe('All Samples');
        expect(queryConfigs[0].schemaQuery.toString()).toBe('lists|' + SINGLE_SAMPLE_TYPE_PICKLIST.name + '|');
        expect(queryConfigs[1].title).toBe('type1');
        expect(queryConfigs[1].schemaQuery.toString()).toBe('samples|type1|');
        expect(queryConfigs[1].baseFilters.length).toBe(1);
        expect(queryConfigs[1].baseFilters[0].getURLParameterName()).toBe('query.RowId~picklistsamples');
        expect(queryConfigs[1].baseFilters[0].getValue()).toBe('Test Picklist 2');
    });

    test('picklist without samples', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () =>
                            Promise.resolve(
                                new Picklist({
                                    listId: 1,
                                    name: 'Test Picklist',
                                    CreatedBy: 1100,
                                    Category: PUBLIC_PICKLIST_CATEGORY,
                                    sampleTypes: [],
                                })
                            ),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);

        const queryConfigs = Object.values(wrapper.find(PicklistOverviewWithQueryModels).prop('queryConfigs'));
        expect(queryConfigs.length).toBe(1);
        expect(queryConfigs[0].title).toBe('All Samples');
        expect(queryConfigs[0].schemaQuery.toString()).toBe('lists|Test Picklist|');
    });

    test('picklist not found', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () => Promise.reject('error'),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, true);
    });

    test('private picklist with perm', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () =>
                            Promise.resolve(
                                new Picklist({
                                    listId: 1,
                                    name: 'Test Picklist',
                                    CreatedBy: 1100,
                                    Category: PRIVATE_PICKLIST_CATEGORY,
                                    sampleTypes: [],
                                })
                            ),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);
    });

    test('private picklist without perm', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, {
                        getPicklistFromId: () =>
                            Promise.resolve(
                                new Picklist({
                                    listId: 1,
                                    name: 'Test Picklist',
                                    CreatedBy: 1101, // this id is not the user id of the test user
                                    Category: PRIVATE_PICKLIST_CATEGORY,
                                    sampleTypes: [],
                                })
                            ),
                    }),
                })}
            />,
            {},
            {}
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, false, true);
    });
});

describe('PicklistOverviewImpl', () => {
    const DEFAULT_PROPS = {
        user: TEST_USER_EDITOR,
        navigate: jest.fn,
        loadPicklist: jest.fn,
        queryModels: {
            model: makeTestQueryModel(SchemaQuery.create('schema', 'query')),
        },
        actions: makeTestActions(),
    };

    function validate(
        wrapper: ReactWrapper,
        picklist: Picklist,
        canEdit = true,
        canDelete = true,
        owner = true,
        isPublic = true
    ): void {
        expect(wrapper.find(Page).prop('title')).toBe(picklist.name);
        expect(wrapper.find(PageDetailHeader).prop('title')).toBe(picklist.name);
        expect(wrapper.find(PageDetailHeader).prop('description')).toBe(picklist.Description);
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(canEdit ? 1 : 0);
        expect(wrapper.find('.picklistHeader-edit')).toHaveLength(canEdit && owner ? 2 : 0);
        expect(wrapper.find('.picklistHeader-delete')).toHaveLength(canDelete ? 2 : 0);
        expect(wrapper.find(SamplesTabbedGridPanel)).toHaveLength(1);
    }

    test('picklist with multiple sample types', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={MULTI_SAMPLE_TYPE_PICKLIST} />,
            {},
            {}
        );
        validate(wrapper, MULTI_SAMPLE_TYPE_PICKLIST);
        wrapper.unmount();
    });

    test('picklist with single sample types', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={SINGLE_SAMPLE_TYPE_PICKLIST} />,
            {},
            {}
        );
        validate(wrapper, SINGLE_SAMPLE_TYPE_PICKLIST);
    });

    test('reader', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={SINGLE_SAMPLE_TYPE_PICKLIST} user={TEST_USER_READER} />,
            {},
            {}
        );
        validate(wrapper, SINGLE_SAMPLE_TYPE_PICKLIST, false, false);
    });

    test('user is not the owner of public picklist', () => {
        const picklist = new Picklist({
            listId: 1,
            name: 'Test Picklist 1',
            CreatedBy: 1101, // test user id is 1100
            Category: PUBLIC_PICKLIST_CATEGORY,
            sampleTypes: [],
        });
        const wrapper = mountWithAppServerContext(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={picklist} />,
            {},
            {}
        );
        validate(wrapper, picklist, false, false);
    });

    test('private picklist', () => {
        const picklist = new Picklist({
            listId: 1,
            name: 'Test Picklist 1',
            CreatedBy: 1100,
            Category: PRIVATE_PICKLIST_CATEGORY,
            sampleTypes: [],
        });
        const wrapper = mountWithAppServerContext(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={picklist} />,
            {},
            {}
        );
        validate(wrapper, picklist, true, true, true, false);
    });
});
