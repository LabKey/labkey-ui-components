import React, { act } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { TEST_USER_EDITOR } from '../../userFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { AppContext } from '../../AppContext';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';
import {
    AddedToPicklistNotification,
    ChoosePicklistModalDisplay,
    PicklistItemsSummary,
    PicklistList,
} from './ChoosePicklistModal';
import { Picklist } from './models';
import { getPicklistTestAPIWrapper } from './APIWrapper';

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

describe('ChoosePicklistModal', () => {
    describe('PicklistList', () => {
        test('no items', () => {
            const emptyMessage = 'This is empty';
            render(
                <PicklistList
                    activeItem={undefined}
                    emptyMessage={emptyMessage}
                    onSelect={jest.fn()}
                    showSharedIcon={false}
                    items={[]}
                />
            );
            expect(document.querySelectorAll('.list-group-item')).toHaveLength(0);
            const empty = document.querySelectorAll('.choices-list__empty-message');
            expect(empty).toHaveLength(1);
            expect(empty[0].textContent).toBe(emptyMessage);
        });

        test('several items, none active', () => {
            const items = [PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST];
            render(
                <PicklistList
                    activeItem={undefined}
                    emptyMessage="This is empty"
                    onSelect={jest.fn()}
                    showSharedIcon={false}
                    items={items}
                />
            );

            expect(document.querySelectorAll('.choices-list__empty-message')).toHaveLength(0);
            expect(document.querySelectorAll('.active')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-users')).toHaveLength(0);

            const listItems = document.querySelectorAll('.list-group-item');
            expect(listItems).toHaveLength(3);
            expect(listItems[0].textContent).toBe(items[0].name);
            expect(listItems[1].textContent).toBe(items[1].name);
            expect(listItems[2].textContent).toBe(items[2].name);
        });

        test('several items, one active, show shared icon', () => {
            render(
                <PicklistList
                    activeItem={PUBLIC_EDITOR_PICKLIST}
                    emptyMessage="This is empty"
                    onSelect={jest.fn()}
                    showSharedIcon
                    items={[PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST]}
                />
            );
            expect(document.querySelectorAll('.active')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-users')).toHaveLength(2);

            const listItems = document.querySelectorAll('.list-group-item');
            expect(listItems).toHaveLength(3);
            expect(listItems[0].querySelectorAll('.fa-users')).toHaveLength(1);
            expect(listItems[2].querySelectorAll('.fa-users')).toHaveLength(1);
        });

        test('several items, one active', () => {
            render(
                <PicklistList
                    activeItem={PUBLIC_EDITOR_PICKLIST}
                    emptyMessage="This is empty"
                    onSelect={jest.fn()}
                    showSharedIcon={false}
                    items={[PUBLIC_EDITOR_PICKLIST, PRIVATE_EDITOR_PICKLIST, EMPTY_EDITOR_PICKLIST]}
                />
            );
            const listItems = document.querySelectorAll('.list-group-item');
            expect(listItems).toHaveLength(3);
            expect(document.querySelectorAll('.active')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-users')).toHaveLength(0);
        });
    });

    describe('PicklistItemsSummary', () => {
        test('empty counts by type', async () => {
            await act(async () => {
                renderWithAppContext(<PicklistItemsSummary picklist={EMPTY_EDITOR_PICKLIST} />);
            });
            const emptyMessage = document.querySelectorAll('.choices-detail__empty-message');
            expect(emptyMessage).toHaveLength(1);
            expect(emptyMessage[0].textContent).toBe('This list is empty.');
            expect(document.querySelector('.picklist-items__header').textContent).toBe('Sample Counts');
        });

        test('empty counts by type, non-zero item count', async () => {
            await act(async () => {
                renderWithAppContext(<PicklistItemsSummary picklist={PUBLIC_EDITOR_PICKLIST} />);
            });
            expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
            expect(document.querySelector('div').textContent).toBe(
                'Sample Counts' + PUBLIC_EDITOR_PICKLIST.ItemCount + ' samples'
            );
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

            const appContext: Partial<AppContext> = {
                api: getTestAPIWrapper(jest.fn, {
                    picklist: getPicklistTestAPIWrapper(jest.fn, { getPicklistCountsBySampleType }),
                }),
            };

            await act(async () => {
                renderWithAppContext(<PicklistItemsSummary picklist={PUBLIC_EDITOR_PICKLIST} />, { appContext });
            });

            expect(document.querySelectorAll('.choices-detail__empty-message')).toHaveLength(0);
            const items = document.querySelectorAll('.picklist-items__row');
            expect(items).toHaveLength(2);
            expect(items[0].querySelectorAll('.color-icon__circle-small')).toHaveLength(1);
            expect(items[0].querySelector('.picklist-items__sample-type').textContent).toBe(countsByType[0].SampleType);
            expect(items[0].querySelector('.picklist-items__item-count').textContent).toBe(
                countsByType[0].ItemCount.toString()
            );
            expect(items[1].querySelectorAll('.color-icon__circle-small')).toHaveLength(1);
            expect(items[1].querySelector('.picklist-items__sample-type').textContent).toBe(countsByType[1].SampleType);
            expect(items[1].querySelector('.picklist-items__item-count').textContent).toBe(
                countsByType[1].ItemCount.toString()
            );
        });
    });

    describe('AddToPicklistNotification', () => {
        test('no samples added', () => {
            render(<AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={0} numSelected={4} />);
            expect(document.body.textContent).toBe(
                `No samples added to picklist "${PUBLIC_EDITOR_PICKLIST.name}". 4 samples were already in the list.`
            );
            expect(document.querySelector('a').textContent).toBe(PUBLIC_EDITOR_PICKLIST.name);
        });

        test('all samples added', () => {
            render(<AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={4} numSelected={4} />);
            expect(document.body.textContent).toBe(
                `Successfully added 4 samples to picklist "${PUBLIC_EDITOR_PICKLIST.name}".`
            );
        });

        test('some samples added', () => {
            render(<AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={2} numSelected={4} />);
            expect(document.body.textContent).toBe(
                `Successfully added 2 samples to picklist "${PUBLIC_EDITOR_PICKLIST.name}". 2 samples were already in the list.`
            );
        });

        test('one sample added', () => {
            render(<AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={1} numSelected={4} />);
            expect(document.body.textContent).toBe(
                `Successfully added 1 sample to picklist "${PUBLIC_EDITOR_PICKLIST.name}". 3 samples were already in the list.`
            );
        });

        test('one sample not added', () => {
            render(<AddedToPicklistNotification picklist={PUBLIC_EDITOR_PICKLIST} numAdded={3} numSelected={4} />);
            expect(document.body.textContent).toBe(
                `Successfully added 3 samples to picklist "${PUBLIC_EDITOR_PICKLIST.name}". 1 sample was already in the list.`
            );
        });
    });

    describe('ChoosePicklistModalDisplay', () => {
        test('loading', () => {
            renderWithAppContext(
                <ChoosePicklistModalDisplay
                    picklists={[]}
                    picklistLoadError={undefined}
                    loading
                    onCancel={jest.fn()}
                    afterAddToPicklist={jest.fn()}
                    user={TEST_USER_EDITOR}
                    sampleIds={['1', '2']}
                    numSelected={2}
                    validCount={2}
                />
            );

            const alert = document.querySelectorAll('.alert-info');
            expect(alert).toHaveLength(0);
            expect(document.querySelector('.modal-body').textContent).toBe(' Loading...');
        });

        test('loading error', () => {
            const errorText = "Couldn't get your data";
            renderWithAppContext(
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

            const alert = document.querySelectorAll('.alert-danger');
            expect(alert).toHaveLength(1);
            expect(alert[0].textContent).toBe(errorText);
        });

        test('adding one sample', () => {
            renderWithAppContext(
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

            const alert = document.querySelectorAll('.alert-info');
            expect(alert).toHaveLength(1);
            expect(alert[0].textContent).toBe('Adding 1 sample to selected picklist. ');
        });

        test('with active item', async () => {
            renderWithAppContext(
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

            await userEvent.click(document.querySelector('.list-group-item'));
            expect(document.querySelectorAll('.choice-details')).toHaveLength(1);
        });
    });
});
