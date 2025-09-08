import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { Picklist } from './models';
import { waitFor } from '@testing-library/dom';

describe('PicklistEditModal', () => {
    function defaultProps(): PicklistEditModalProps {
        return {
            onCancel: jest.fn(),
            onFinish: jest.fn(),
        };
    }

    async function waitForLoaded() {
        await waitFor(() => {
            expect(document.querySelector('.fa-pulse')).not.toBeInTheDocument();
        });
    }

    async function validateText(expectedTitle: string, expectedFinishText: string): Promise<void> {
        await waitForLoaded();
        const title = document.querySelector('.modal-title');
        expect(title.textContent).toBe(expectedTitle);
        const buttons = document.querySelectorAll('.modal-footer .btn');
        expect(buttons).toHaveLength(2);
        expect(buttons[1].textContent).toBe(expectedFinishText);
    }

    test('create empty picklist', async () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} />);
        await validateText('Create an Empty Picklist', 'Create Picklist');

        const labels = document.querySelectorAll('label');
        expect(labels).toHaveLength(3);
        expect(labels[0].textContent).toBe('Name *');
        expect(labels[1].textContent).toBe('Description');
        expect(labels[2].textContent).toBe('Share this picklist');

        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[0].value).toBeFalsy();
        expect(inputs[1].checked).toBe(false);
    });

    test('create picklist from multiple selections', async () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} selectedRowIds={['1', '2']} />);
        await validateText('Create a New Picklist with the 2 Selected Samples', 'Create Picklist');
    });

    test('create picklist from one selection', async () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} selectedRowIds={['1']} />);
        await validateText('Create a New Picklist with This Sample', 'Create Picklist');
    });

    test('Update private picklist', async () => {
        const existingList = new Picklist({
            Category: PRIVATE_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        renderWithAppContext(<PicklistEditModal {...defaultProps()} picklist={existingList} />);
        await validateText('Update Picklist Data', 'Update Picklist');

        const labels = document.querySelectorAll('label');
        expect(labels).toHaveLength(3);
        expect(labels[0].textContent).toBe('Name *');
        expect(labels[1].textContent).toBe('Description');
        expect(labels[2].textContent).toBe('Share this picklist');

        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[0].value).toBe(existingList.name);
        expect(inputs[1].checked).toBe(false);

        const textarea = document.querySelector('textarea');
        expect(textarea.value).toBe(existingList.Description);
    });

    test('Update public picklist', async () => {
        const existingList = new Picklist({
            Category: PUBLIC_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        renderWithAppContext(<PicklistEditModal {...defaultProps()} picklist={existingList} />);
        await waitForLoaded();
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[1].checked).toBe(true);
    });
});
