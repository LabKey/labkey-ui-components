import React from 'react';
import { Checkbox } from "react-bootstrap";
import { mount, ReactWrapper } from 'enzyme';

import { PicklistOverview, PicklistOverviewImpl, PicklistOverviewWithQueryModels } from './PicklistOverview';
import { TEST_USER_EDITOR, TEST_USER_READER } from "../../../test/data/users";
import { getTestPicklistAPIWrapper } from "./APIWrapper";
import { Picklist } from "./models";
import { LoadingPage } from "../base/LoadingPage";
import { NotFound } from "../base/NotFound";
import { InsufficientPermissionsPage } from "../permissions/InsufficientPermissionsPage";
import { waitForLifecycle } from "../../testHelpers";
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from "../domainproperties/list/constants";
import { initNotificationsState } from "../notifications/global";
import { makeTestActions, makeTestQueryModel } from "../../../public/QueryModel/testUtils";
import { Page } from "../base/Page";
import { PageDetailHeader } from "../forms/PageDetailHeader";
import { ManageDropdownButton } from "../buttons/ManageDropdownButton";
import { SamplesTabbedGridPanel } from "../samples/SamplesTabbedGridPanel";
import { SchemaQuery } from "../../../public/SchemaQuery";

const MULTI_SAMPLE_TYPE_PICKLIST = new Picklist({
    listId: 1,
    name: 'Test Picklist 1',
    Description: 'desc 1',
    CreatedBy: 1100,
    Category: PUBLIC_PICKLIST_CATEGORY,
    sampleIdsByType: {
        type1: [1, 2],
        type2: [3, 4, 5],
    },
});

const SINGLE_SAMPLE_TYPE_PICKLIST = new Picklist({
    listId: 2,
    name: 'Test Picklist 2',
    Description: 'desc 2',
    CreatedBy: 1100,
    Category: PUBLIC_PICKLIST_CATEGORY,
    sampleIdsByType: {
        type1: [1, 2],
    },
});

beforeAll(() => {
    initNotificationsState();
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
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.resolve(MULTI_SAMPLE_TYPE_PICKLIST),
                })}
            />
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
        expect(queryConfigs[1].baseFilters[0].getValue()).toStrictEqual([1,2]);
        expect(queryConfigs[2].title).toBe('type2');
        expect(queryConfigs[2].schemaQuery.toString()).toBe('samples|type2|');
        expect(queryConfigs[2].baseFilters.length).toBe(1);
        expect(queryConfigs[2].baseFilters[0].getValue()).toStrictEqual([3,4,5]);

        wrapper.unmount();
    });

    test('picklist with single sample type', async () => {
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.resolve(SINGLE_SAMPLE_TYPE_PICKLIST),
                })}
            />
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
        expect(queryConfigs[1].baseFilters[0].getValue()).toStrictEqual([1,2]);

        wrapper.unmount();
    });

    test('picklist without samples', async () => {
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.resolve(new Picklist({
                        listId: 1,
                        name: 'Test Picklist',
                        CreatedBy: 1100,
                        Category: PUBLIC_PICKLIST_CATEGORY,
                        sampleIdsByType: {},
                    })),
                })}
            />
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);

        const queryConfigs = Object.values(wrapper.find(PicklistOverviewWithQueryModels).prop('queryConfigs'));
        expect(queryConfigs.length).toBe(1);
        expect(queryConfigs[0].title).toBe('All Samples');
        expect(queryConfigs[0].schemaQuery.toString()).toBe('lists|Test Picklist|');

        wrapper.unmount();
    });

    test('picklist not found', async () => {
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.reject('error'),
                })}
            />
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, true);
        wrapper.unmount();
    });

    test('private picklist with perm', async () => {
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.resolve(new Picklist({
                        listId: 1,
                        name: 'Test Picklist',
                        CreatedBy: 1100,
                        Category: PRIVATE_PICKLIST_CATEGORY,
                        sampleIdsByType: {},
                    })),
                })}
            />
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('private picklist without perm', async () => {
        const wrapper = mount(
            <PicklistOverview
                {...DEFAULT_PROPS}
                api={getTestPicklistAPIWrapper(jest.fn, {
                    getPicklistFromId: () => Promise.resolve(new Picklist({
                        listId: 1,
                        name: 'Test Picklist',
                        CreatedBy: 1101, // this id is not the user id of the test user
                        Category: PRIVATE_PICKLIST_CATEGORY,
                        sampleIdsByType: {},
                    })),
                })}
            />
        );
        validate(wrapper, true);
        await waitForLifecycle(wrapper);
        validate(wrapper, false, false, true);
        wrapper.unmount();
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

    function validate(wrapper: ReactWrapper, picklist: Picklist, canEdit = true, canDelete = true, owner = true, isPublic = true): void {
        expect(wrapper.find(Page).prop('title')).toBe(picklist.name);
        expect(wrapper.find(PageDetailHeader).prop('title')).toBe(picklist.name);
        expect(wrapper.find(PageDetailHeader).prop('description')).toBe(picklist.Description);
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(canEdit ? 1 : 0);
        expect(wrapper.find('.picklistHeader-edit')).toHaveLength(canEdit && owner ? 2 : 0);
        expect(wrapper.find('.picklistHeader-delete')).toHaveLength(canDelete ? 2 : 0);
        expect(wrapper.find('.picklist-sharing')).toHaveLength(canEdit ? 1 : 0);
        expect(wrapper.find(SamplesTabbedGridPanel)).toHaveLength(1);
        if (canEdit) expect(wrapper.find(Checkbox).prop('checked')).toBe(isPublic);
    }

    test('picklist with multiple sample types', () => {
        const wrapper = mount(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={MULTI_SAMPLE_TYPE_PICKLIST}/>
        );
        validate(wrapper, MULTI_SAMPLE_TYPE_PICKLIST);
        wrapper.unmount();
    });

    test('picklist with single sample types', () => {
        const wrapper = mount(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={SINGLE_SAMPLE_TYPE_PICKLIST}/>
        );
        validate(wrapper, SINGLE_SAMPLE_TYPE_PICKLIST);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mount(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={SINGLE_SAMPLE_TYPE_PICKLIST} user={TEST_USER_READER}/>
        );
        validate(wrapper, SINGLE_SAMPLE_TYPE_PICKLIST, false, false);
        wrapper.unmount();
    });

    test('user is not the owner of public picklist', () => {
        const picklist = new Picklist({
            listId: 1,
            name: 'Test Picklist 1',
            CreatedBy: 1101, // test user id is 1100
            Category: PUBLIC_PICKLIST_CATEGORY,
            sampleIdsByType: {},
        });
        const wrapper = mount(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={picklist} />
        );
        validate(wrapper, picklist, false, false);
        wrapper.unmount();
    });

    test('private picklist', () => {
        const picklist = new Picklist({
            listId: 1,
            name: 'Test Picklist 1',
            CreatedBy: 1100,
            Category: PRIVATE_PICKLIST_CATEGORY,
            sampleIdsByType: {},
        });
        const wrapper = mount(
            <PicklistOverviewImpl {...DEFAULT_PROPS} picklist={picklist} />
        );
        validate(wrapper, picklist, true, true, true, false);
        wrapper.unmount();
    });
});
