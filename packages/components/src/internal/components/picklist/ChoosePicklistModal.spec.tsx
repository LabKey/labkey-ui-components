import React from 'react';

import { mount, shallow } from 'enzyme';

import { ModalBody } from 'react-bootstrap';

import { TEST_USER_EDITOR } from '../../userFixtures';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

import {
    AddedToPicklistNotification,
    ChoosePicklistModalDisplay,
    PicklistDetails,
    PicklistItemsSummary,
    PicklistList,
} from './ChoosePicklistModal';

import { Picklist } from './models';
import { getPicklistTestAPIWrapper } from './APIWrapper';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

const PUBLIC_EDITOR_PICKLIST = new Picklist({
    name: 'Test public list',
    Category: PUBLIC_PICKLIST_CATEGORY,
    ItemCount: 4,
    CreatedBy: TEST_USER_EDITOR.id,
    CreatedByDisplay: TEST_USER_EDITOR.displayName,
    listId: 15,
    Created: '2021-04-15',
    Description: "Editor's public picklist",
});

const PRIVATE_EDITOR_PICKLIST = new Picklist({
    name: 'Test private list',
    Category: PRIVATE_PICKLIST_CATEGORY,
    ItemCount: 23,
    CreatedBy: TEST_USER_EDITOR.id,
    CreatedByDisplay: TEST_USER_EDITOR.displayName,
    listId: 16,
    Created: '2021-04-16',
    Description: "Editor's private picklist",
});

const EMPTY_EDITOR_PICKLIST = new Picklist({
    name: 'Test public list',
    Category: PUBLIC_PICKLIST_CATEGORY,
    ItemCount: 0,
    CreatedBy: TEST_USER_EDITOR.id,
    CreatedByDisplay: TEST_USER_EDITOR.displayName,
    listId: 17,
    Created: '2021-04-17',
    Description: "Empty editor's public picklist",
});

describe('PicklistList', () => {
    test('no items', () => {
        const emptyMessage = 'This is empty';
        const wrapper = mount(
            <PicklistList
                activeItem={undefined}
                emptyMessage={emptyMessage}
                onSelect={jest.fn()}
                showSharedIcon={false}
                items={[]}
            />
        );
        expect(wrapper.find('.list-group-item')).toHaveLength(0);
        const empty = wrapper.find('.choices-list__empty-message');
        expect(empty).toHaveLength(1);
        expect(empty.text()).toBe(emptyMessage);
        wrapper.unmount();
    });

    test('several items, none active', () => {
        const emptyMessage = 'This is empty';
        const items = [PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST];
        const wrapper = mount(
            <PicklistList
                activeItem={undefined}
                emptyMessage={emptyMessage}
                onSelect={jest.fn()}
                showSharedIcon={false}
                items={items}
            />
        );
        const empty = wrapper.find('.choices-list__empty-message');
        expect(empty).toHaveLength(0);
        const listItems = wrapper.find('.list-group-item');
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(listItems).toHaveLength(3);
        expect(listItems.at(0).text()).toBe(items[0].name);
        expect(listItems.at(1).text()).toBe(items[1].name);
        expect(listItems.at(2).text()).toBe(items[2].name);
        expect(wrapper.find('.fa-users')).toHaveLength(0);
        wrapper.unmount();
    });

    test('several items, one active, show shared icon', () => {
        const emptyMessage = 'This is empty';
        const wrapper = mount(
            <PicklistList
                activeItem={PUBLIC_EDITOR_PICKLIST}
                emptyMessage={emptyMessage}
                onSelect={jest.fn()}
                showSharedIcon={true}
                items={[PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST]}
            />
        );
        const listItems = wrapper.find('.list-group-item');
        expect(wrapper.find('.active')).toHaveLength(1);
        expect(wrapper.find('.fa-users')).toHaveLength(2);

        expect(listItems).toHaveLength(3);
        expect(listItems.at(0).find('.fa-users')).toHaveLength(1);
        expect(listItems.at(2).find('.fa-users')).toHaveLength(1);

        wrapper.unmount();
    });

    test('several items, one active', () => {
        const emptyMessage = 'This is empty';
        const wrapper = mount(
            <PicklistList
                activeItem={PUBLIC_EDITOR_PICKLIST}
                emptyMessage={emptyMessage}
                onSelect={jest.fn()}
                showSharedIcon={false}
                items={[PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST]}
            />
        );
        const listItems = wrapper.find('.list-group-item');
        expect(listItems).toHaveLength(3);
        expect(wrapper.find('.active')).toHaveLength(1);
        expect(wrapper.find('.fa-users')).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('PicklistItemsSummary', () => {
    test('empty counts by type', async () => {
        const wrapper = mountWithAppServerContext(<PicklistItemsSummary picklist={EMPTY_EDITOR_PICKLIST} />);
        await waitForLifecycle(wrapper);
        const emptyMessage = wrapper.find('.choices-detail__empty-message');
        expect(emptyMessage).toHaveLength(1);
        expect(emptyMessage.text()).toBe('This list is empty.');
        expect(wrapper.find('.picklist-items__header').text()).toBe('Sample Counts');
        wrapper.unmount();
    });

    test('empty counts by type, non-zero item count', async () => {
        const wrapper = mountWithAppServerContext(<PicklistItemsSummary picklist={PUBLIC_EDITOR_PICKLIST} />);
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.choices-detail__empty-message').exists()).toBe(false);
        expect(wrapper.text()).toBe('Sample Counts' + PUBLIC_EDITOR_PICKLIST.ItemCount + ' samples');
        wrapper.unmount();
    });

    test('multiple items', async () => {
        const countsByType = [
            {
                ItemCount: 42,
                SampleType: 'Sample Type 1',
                LabelColor: 'blue',
            },
            {
                ItemCount: 88,
                SampleType: 'Sample Type 2',
                LabelColor: 'red',
            },
        ];
        const getPicklistCountsBySampleType = jest.fn().mockResolvedValue(countsByType);

        const wrapper = mountWithAppServerContext(<PicklistItemsSummary picklist={PUBLIC_EDITOR_PICKLIST} />, {
            api: getTestAPIWrapper(jest.fn, {
                picklist: getPicklistTestAPIWrapper(jest.fn, { getPicklistCountsBySampleType }),
            }),
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.choices-detail__empty-message').exists()).toBe(false);
        const items = wrapper.find('.picklist-items__row');
        expect(items).toHaveLength(2);
        expect(items.at(0).find('ColorIcon')).toHaveLength(1);
        expect(items.at(0).find('.picklist-items__sample-type').text()).toBe(countsByType[0].SampleType);
        expect(items.at(0).find('.picklist-items__item-count').text()).toBe(countsByType[0].ItemCount.toString());
        expect(items.at(1).find('ColorIcon')).toHaveLength(1);
        expect(items.at(1).find('.picklist-items__sample-type').text()).toBe(countsByType[1].SampleType);
        expect(items.at(1).find('.picklist-items__item-count').text()).toBe(countsByType[1].ItemCount.toString());

        wrapper.unmount();
    });
});

describe('PicklistDetails', () => {
    test('public picklist', () => {
        const wrapper = shallow(<PicklistDetails picklist={PUBLIC_EDITOR_PICKLIST} />);
        const name = wrapper.find('.choice-details__name');
        expect(name).toHaveLength(1);
        expect(name.text()).toBe(PUBLIC_EDITOR_PICKLIST.name);

        const metadata = wrapper.find('.choice-metadata-item');
        expect(metadata).toHaveLength(2);
        expect(metadata.at(0).text()).toBe('Created by:' + PUBLIC_EDITOR_PICKLIST.CreatedByDisplay);
        expect(metadata.at(1).text()).toBe('Created:' + PUBLIC_EDITOR_PICKLIST.Created);
        const description = wrapper.find('.choice-details__description');
        expect(description).toHaveLength(1);
        expect(description.text()).toBe(PUBLIC_EDITOR_PICKLIST.Description);
        const summary = wrapper.find('.choice-details__summary');
        expect(summary).toHaveLength(1);
        wrapper.unmount();
    });

    test('private picklist', () => {
        const wrapper = shallow(<PicklistDetails picklist={PRIVATE_EDITOR_PICKLIST} />);
        const name = wrapper.find('.choice-details__name');
        expect(name).toHaveLength(1);
        expect(name.text()).toBe(PRIVATE_EDITOR_PICKLIST.name);

        const metadata = wrapper.find('.choice-metadata-item');
        expect(metadata).toHaveLength(1);
        expect(metadata.at(0).text()).toBe('Created:' + PRIVATE_EDITOR_PICKLIST.Created);
        const description = wrapper.find('.choice-details__description');
        expect(description).toHaveLength(1);
        expect(description.text()).toBe(PRIVATE_EDITOR_PICKLIST.Description);
        const summary = wrapper.find('.choice-details__summary');
        expect(summary).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('AddToPicklistNotification', () => {
    test('no samples added', () => {
        const wrapper = mount(
            <AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={0} numSelected={4} />
        );
        expect(wrapper.text()).toBe(
            'No samples added to picklist "' + PUBLIC_EDITOR_PICKLIST.name + '". 4 samples were already in the list.'
        );
        const link = wrapper.find('a');
        expect(link).toHaveLength(1);
        expect(link.text()).toBe(PUBLIC_EDITOR_PICKLIST.name);
        wrapper.unmount();
    });

    test('all samples added', () => {
        const wrapper = mount(
            <AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={4} numSelected={4} />
        );
        expect(wrapper.text()).toBe('Successfully added 4 samples to picklist "' + PUBLIC_EDITOR_PICKLIST.name + '".');
        wrapper.unmount();
    });

    test('some samples added', () => {
        const wrapper = mount(
            <AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={2} numSelected={4} />
        );
        expect(wrapper.text()).toBe(
            'Successfully added 2 samples to picklist "' +
                PUBLIC_EDITOR_PICKLIST.name +
                '". 2 samples were already in the list.'
        );
        wrapper.unmount();
    });

    test('one sample added', () => {
        const wrapper = mount(
            <AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={1} numSelected={4} />
        );
        expect(wrapper.text()).toBe(
            'Successfully added 1 sample to picklist "' +
                PUBLIC_EDITOR_PICKLIST.name +
                '". 3 samples were already in the list.'
        );
        wrapper.unmount();
    });

    test('one sample not added', () => {
        const wrapper = mount(
            <AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={3} numSelected={4} />
        );
        expect(wrapper.text()).toBe(
            'Successfully added 3 samples to picklist "' +
                PUBLIC_EDITOR_PICKLIST.name +
                '". 1 sample was already in the list.'
        );
        wrapper.unmount();
    });
});

describe('ChoosePicklistModalDisplay', () => {
    test('loading', async () => {
        const wrapper = mountWithAppServerContext(
            <ChoosePicklistModalDisplay
                picklists={[]}
                picklistLoadError={undefined}
                loading={true}
                onCancel={jest.fn()}
                afterAddToPicklist={jest.fn()}
                user={TEST_USER_EDITOR}
                sampleIds={['1', '2']}
                numSelected={2}
                validCount={2}
            />
        );

        await waitForLifecycle(wrapper);
        const alert = wrapper.find('.alert-info');
        expect(alert).toHaveLength(0);
        const body = wrapper.find(ModalBody);
        expect(body.text()).toBe(' Loading...');
        wrapper.unmount();
    });

    test('loading error', async () => {
        const errorText = "Couldn't get your data";
        const wrapper = mountWithAppServerContext(
            <ChoosePicklistModalDisplay
                picklists={[]}
                picklistLoadError={errorText}
                loading={false}
                onCancel={jest.fn()}
                afterAddToPicklist={jest.fn()}
                user={TEST_USER_EDITOR}
                sampleIds={['1', '2']}
                numSelected={2}
                validCount={2}
            />
        );
        await waitForLifecycle(wrapper);

        const alert = wrapper.find('.alert-danger');
        expect(alert).toHaveLength(1);
        expect(alert.text()).toBe(errorText);
        wrapper.unmount();
    });

    test('adding one sample', async () => {
        const wrapper = mountWithAppServerContext(
            <ChoosePicklistModalDisplay
                picklists={[]}
                picklistLoadError={undefined}
                loading={false}
                onCancel={jest.fn()}
                afterAddToPicklist={jest.fn()}
                user={TEST_USER_EDITOR}
                sampleIds={['1']}
                numSelected={1}
                validCount={1}
            />
        );
        await waitForLifecycle(wrapper);

        const alert = wrapper.find('.alert-info');
        expect(alert).toHaveLength(1);
        expect(alert.text()).toBe('Adding 1 sample to selected picklist. ');
        wrapper.unmount();
    });

    test('with active item', async () => {
        const wrapper = mountWithAppServerContext(
            <ChoosePicklistModalDisplay
                picklists={[PUBLIC_EDITOR_PICKLIST]}
                picklistLoadError={undefined}
                loading={false}
                onCancel={jest.fn()}
                afterAddToPicklist={jest.fn()}
                user={TEST_USER_EDITOR}
                sampleIds={['1']}
                numSelected={1}
                validCount={1}
            />
        );
        await waitForLifecycle(wrapper);

        const picklistButtons = wrapper.find('.list-group-item');
        picklistButtons.at(0).simulate('click');
        expect(wrapper.find('.choice-details')).toHaveLength(1);
        wrapper.unmount();
    });
});
