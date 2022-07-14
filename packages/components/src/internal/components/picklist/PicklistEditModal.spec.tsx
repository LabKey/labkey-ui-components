import React from 'react';

import { ReactWrapper } from 'enzyme';
import { Button, Modal, ModalFooter, ModalTitle } from 'react-bootstrap';

import { Alert, OperationConfirmationData, Picklist } from '../../..';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';
import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

import { PicklistEditModal } from './PicklistEditModal';

describe('PicklistEditModal', () => {
    const allAllowedStatus = new OperationConfirmationData({
        allowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    const noneAllowedStatus = new OperationConfirmationData({
        notAllowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    const someAllowedStatus = new OperationConfirmationData({
        allowed: [
            {
                Name: 'T-3',
                RowId: 3,
            },
        ],
        notAllowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    function validateText(wrapper: ReactWrapper, expectedTitle: string, expectedFinishText: string) {
        const modal = wrapper.find(Modal);
        const title = modal.find(ModalTitle);
        expect(title.text()).toBe(expectedTitle);
        const footer = modal.find(ModalFooter);
        const buttons = footer.find(Button);
        expect(buttons).toHaveLength(2);
        expect(buttons.at(1).text()).toBe(expectedFinishText);
    }

    function validateForm(wrapper: ReactWrapper, existingList?: Picklist) {
        const labels = wrapper.find('label');
        expect(labels).toHaveLength(3);
        expect(labels.at(0).text()).toBe('Name *');
        expect(labels.at(1).text()).toBe('Description');
        expect(labels.at(2).text()).toBe('Share this picklist publicly with team members');
        if (existingList) {
            expect(wrapper.find('input').at(0).prop('value')).toBe(existingList.name);
        } else {
            expect(wrapper.find('input').at(0).prop('value')).toBeFalsy();
        }
        if (existingList) {
            expect(wrapper.find('input').at(1).prop('checked')).toBe(existingList.isPublic());
        } else {
            expect(wrapper.find('input').at(1).prop('checked')).toBe(false);
        }
        if (existingList) {
            expect(wrapper.find('textarea').prop('value')).toBe(existingList.Description);
        } else {
            expect(wrapper.find('textarea').prop('value')).toBeFalsy();
        }
    }

    test('create empty picklist', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                selectionKey="selection"
                selectedQuantity={0}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
            />
        );
        validateText(wrapper, 'Create an Empty Picklist', 'Create Picklist');
        validateForm(wrapper);
        wrapper.unmount();
    });

    test('create picklist from multiple selections', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                selectionKey="selection"
                selectedQuantity={2}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
            />
        );
        validateText(wrapper, 'Create a New Picklist with the 2 Selected Samples', 'Create Picklist');

        wrapper.unmount();
    });

    test('create picklist from one selection', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                selectionKey="selection"
                selectedQuantity={1}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
            />
        );
        validateText(wrapper, 'Create a New Picklist with the 1 Selected Sample', 'Create Picklist');

        wrapper.unmount();
    });

    test('create empty picklist from sampleIds', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal sampleIds={[]} onCancel={jest.fn()} onFinish={jest.fn()} />
        );
        validateText(wrapper, 'Create an Empty Picklist', 'Create Picklist');

        wrapper.unmount();
    });

    test('create picklist from one sampleId', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal sampleIds={['1']} onCancel={jest.fn()} onFinish={jest.fn()} />
        );
        validateText(wrapper, 'Create a New Picklist with This Sample', 'Create Picklist');

        wrapper.unmount();
    });

    test('create picklist from multiple sampleIds', () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal sampleIds={['1', '2']} onCancel={jest.fn()} onFinish={jest.fn()} />
        );
        validateText(wrapper, 'Create a New Picklist with These Samples', 'Create Picklist');

        wrapper.unmount();
    });

    test('Update private picklist', () => {
        const existingList = new Picklist({
            Category: PRIVATE_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal picklist={existingList} onCancel={jest.fn()} onFinish={jest.fn()} />
        );
        validateText(wrapper, 'Update Picklist Data', 'Update Picklist');
        const labels = wrapper.find('label');
        expect(labels).toHaveLength(3);
        expect(labels.at(0).text()).toBe('Name *');
        expect(labels.at(1).text()).toBe('Description');
        expect(labels.at(2).text()).toBe('Share this picklist publicly with team members');
        expect(wrapper.find('input').at(0).prop('value')).toBe(existingList.name);
        expect(wrapper.find('input').at(1).prop('checked')).toBe(false);
        expect(wrapper.find('textarea').prop('value')).toBe(existingList.Description);
        wrapper.unmount();
    });

    test('Update public picklist', () => {
        const existingList = new Picklist({
            Category: PUBLIC_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal picklist={existingList} onCancel={jest.fn()} onFinish={jest.fn()} />
        );
        expect(wrapper.find('input').at(1).prop('checked')).toBe(true);
        wrapper.unmount();
    });

    test('Create picklist, none allowed', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                sampleIds={['1', '2']}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () => Promise.resolve(noneAllowedStatus),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validateText(wrapper, 'Create an Empty Picklist', 'Create Picklist');
        const alerts = wrapper.find(Alert);
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toBeFalsy();
        expect(alerts.at(1).text()).toBe('All selected samples have a status that prevents adding them to a picklist.');
    });

    test('Create picklist, some allowed', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                sampleIds={['1', '2']}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () => Promise.resolve(someAllowedStatus),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validateText(wrapper, 'Create a New Picklist with This Sample', 'Create Picklist');
        const alerts = wrapper.find(Alert);
        expect(alerts).toHaveLength(2);
        expect(alerts.at(1).text()).toBe(
            'The current status of 2 selected samples prevents adding them to a picklist.'
        );
    });

    test('Create picklist, all allowed', async () => {
        const wrapper = mountWithAppServerContext(
            <PicklistEditModal
                sampleIds={['1', '2']}
                onCancel={jest.fn()}
                onFinish={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () => Promise.resolve(allAllowedStatus),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        validateText(wrapper, 'Create a New Picklist with These Samples', 'Create Picklist');
        const alerts = wrapper.find(Alert);
        expect(alerts).toHaveLength(2);
        expect(alerts.at(0).text()).toBeFalsy();
        expect(alerts.at(1).text()).toBeFalsy();
    });
});
