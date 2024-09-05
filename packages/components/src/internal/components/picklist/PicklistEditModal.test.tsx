import React from 'react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

import { PicklistEditModal, PicklistEditModalProps } from './PicklistEditModal';
import { Picklist } from './models';

describe('PicklistEditModal', () => {
    const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));

    function defaultProps(): PicklistEditModalProps {
        return {
            onCancel: jest.fn(),
            onFinish: jest.fn(),
        };
    }

    function validateText(expectedTitle: string, expectedFinishText: string): void {
        const title = document.querySelector('.modal-title');
        expect(title.textContent).toBe(expectedTitle);
        const buttons = document.querySelectorAll('.modal-footer .btn');
        expect(buttons).toHaveLength(2);
        expect(buttons[1].textContent).toBe(expectedFinishText);
    }

    test('create empty picklist', () => {
        renderWithAppContext(<PicklistEditModal onCancel={jest.fn()} onFinish={jest.fn()} />);
        validateText('Create an Empty Picklist', 'Create Picklist');

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

    test('create picklist from multiple selections', () => {
        renderWithAppContext(
            <PicklistEditModal
                {...defaultProps()}
                queryModel={queryModel.mutate({ selections: new Set(['1', '2']) })}
            />
        );
        validateText('Create a New Picklist with the 2 Selected Samples', 'Create Picklist');
    });

    test('create picklist from one selection', () => {
        renderWithAppContext(
            <PicklistEditModal {...defaultProps()} queryModel={queryModel.mutate({ selections: new Set(['1']) })} />
        );
        validateText('Create a New Picklist with the 1 Selected Sample', 'Create Picklist');
    });

    test('create empty picklist from sampleIds', () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} sampleIds={[]} />);
        validateText('Create an Empty Picklist', 'Create Picklist');
    });

    test('create picklist from one sampleId', () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} sampleIds={['1']} />);
        validateText('Create a New Picklist with This Sample', 'Create Picklist');
    });

    test('create picklist from multiple sampleIds', () => {
        renderWithAppContext(<PicklistEditModal {...defaultProps()} sampleIds={['1', '2']} />);
        validateText('Create a New Picklist with These Samples', 'Create Picklist');
    });

    test('Update private picklist', () => {
        const existingList = new Picklist({
            Category: PRIVATE_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        renderWithAppContext(<PicklistEditModal {...defaultProps()} picklist={existingList} />);
        validateText('Update Picklist Data', 'Update Picklist');

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

    test('Update public picklist', () => {
        const existingList = new Picklist({
            Category: PUBLIC_PICKLIST_CATEGORY,
            name: 'Existing list',
            Description: 'My test description',
        });
        renderWithAppContext(<PicklistEditModal {...defaultProps()} picklist={existingList} />);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[1].checked).toBe(true);
    });
});
