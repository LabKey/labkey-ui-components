import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { List } from 'immutable';

import {
    SELECT_INPUT_DISABLED_SELECTOR,
    SELECT_INPUT_PLACEHOLDER_SELECTOR,
    SELECT_INPUT_SINGLE_VALUE_SELECTOR,
} from '../../forms/input/SelectInputTestUtils';
import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { DomainField } from '../models';

import { AdvancedSettings, DisplayTitle, SearchIndexing, IndexField } from './ListPropertiesAdvancedSettings';
import { ListModel } from './models';

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('AdvancedSettings', () => {
    test('default properties', () => {
        const advancedSettings = (
            <AdvancedSettings title="Advanced Settings" model={emptyNewModel} applyAdvancedProperties={jest.fn()} />
        );

        const container = render(advancedSettings).container;
        expect(container).toMatchSnapshot();
    });

    test('display title select dropdown with existing list', () => {
        render(<DisplayTitle model={populatedExistingModel} onSelectChange={jest.fn()} titleColumn="Name" />);

        expect(document.querySelector(SELECT_INPUT_SINGLE_VALUE_SELECTOR).textContent).toEqual('Name');
        expect(document.querySelectorAll(SELECT_INPUT_DISABLED_SELECTOR)).toHaveLength(0);
    });

    test('display title select dropdown with new list and no fields present', () => {
        render(<DisplayTitle model={emptyNewModel} onSelectChange={jest.fn()} titleColumn={null} />);

        expect(document.querySelector(SELECT_INPUT_PLACEHOLDER_SELECTOR).textContent).toEqual(
            'No fields have been defined yet'
        );
        expect(document.querySelectorAll(SELECT_INPUT_DISABLED_SELECTOR)).toHaveLength(1);
    });

    test('display title select dropdown with new list and some fields present', () => {
        const newModelWithOneField = emptyNewModel.setIn(
            ['domain', 'fields'],
            List.of(DomainField.create({ name: 'dummyField' }))
        ) as ListModel;

        render(<DisplayTitle model={newModelWithOneField} onSelectChange={jest.fn()} titleColumn={null} />);

        expect(document.querySelector(SELECT_INPUT_PLACEHOLDER_SELECTOR).textContent).toEqual('Auto');
        expect(document.querySelectorAll(SELECT_INPUT_DISABLED_SELECTOR)).toHaveLength(0);
    });

    test("either search indexing options 'index entire list' or 'index each item' may be open, but not both", async () => {
        render(
            <SearchIndexing
                onRadioChange={jest.fn()}
                onInputChange={jest.fn()}
                onCheckboxChange={jest.fn()}
                eachItemIndex={false}
                entireListIndexSettings={{
                    entireListBodySetting: undefined,
                    entireListBodyTemplate: undefined,
                    entireListIndexSetting: undefined,
                    entireListTitleTemplate: undefined,
                }}
                entireListIndex={false}
                eachItemIndexSettings={{
                    eachItemBodySetting: undefined,
                    eachItemBodyTemplate: undefined,
                    eachItemTitleTemplate: undefined,
                }}
                fileAttachmentIndex={false}
            />
        );

        await userEvent.click(document.querySelector('.fa-angle-right'));
        expect(document.querySelectorAll('input[id="entireListTitleTemplate"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[id="eachItemTitleTemplate"]')).toHaveLength(0);

        await userEvent.click(document.querySelector('.fa-angle-right'));
        expect(document.querySelectorAll('input[id="entireListTitleTemplate"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[id="eachItemTitleTemplate"]')).toHaveLength(1);
    });

    test("setting 'index using custom template' generates a text input field", () => {
        render(
            <IndexField
                name="entireListBodySetting"
                onRadioChange={jest.fn()}
                onInputChange={jest.fn()}
                bodySetting={2}
                bodyTemplate=""
            />
        );

        expect(
            document.querySelectorAll('input.list__advanced-settings-modal__custom-template-text-field')
        ).toHaveLength(1);
    });
});
