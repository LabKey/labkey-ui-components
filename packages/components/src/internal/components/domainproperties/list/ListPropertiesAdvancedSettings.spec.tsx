import React from 'react';

import { mount } from 'enzyme';

import { List } from 'immutable';

import renderer from 'react-test-renderer';

import {
    SELECT_INPUT_DISABLED_SELECTOR,
    SELECT_INPUT_PLACEHOLDER_SELECTOR,
    SELECT_INPUT_SINGLE_VALUE_SELECTOR,
} from '../../forms/input/SelectInputTestUtils';
import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import {
    AdvancedSettings,
    DisplayTitle,
    SearchIndexing,
    SingleDocumentIndexFields,
    SeparateDocumentIndexFields,
    IndexField,
} from './ListPropertiesAdvancedSettings';
import { ListModel } from './models';
import {DomainField} from "../models";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('AdvancedSettings', () => {
    test('new list, default properties', () => {
        const advancedSettings = (
            <AdvancedSettings title="Advanced Settings" model={emptyNewModel} applyAdvancedProperties={jest.fn()} />
        );

        const tree = renderer.create(advancedSettings);
        expect(tree).toMatchSnapshot();
    });

    test('existing list, existing properties', () => {
        const advancedSettings = (
            <AdvancedSettings
                title="Advanced Settings"
                model={populatedExistingModel}
                applyAdvancedProperties={jest.fn()}
            />
        );

        const tree = renderer.create(advancedSettings);
        expect(tree).toMatchSnapshot();
    });

    test('display title select dropdown with existing list', () => {
        const displayTitle = mount(
            <DisplayTitle model={populatedExistingModel} onSelectChange={jest.fn()} titleColumn="Name" />
        );

        expect(displayTitle.find(SELECT_INPUT_SINGLE_VALUE_SELECTOR).text()).toEqual('Name');
        expect(displayTitle.exists(SELECT_INPUT_DISABLED_SELECTOR)).toBeFalsy();
        displayTitle.unmount();
    });

    test('display title select dropdown with new list and no fields present', () => {
        const displayTitle = mount(
            <DisplayTitle model={emptyNewModel} onSelectChange={jest.fn()} titleColumn={null} />
        );

        expect(displayTitle.find(SELECT_INPUT_PLACEHOLDER_SELECTOR).text()).toEqual('No fields have been defined yet');
        expect(displayTitle.exists(SELECT_INPUT_DISABLED_SELECTOR)).toBeTruthy();
        displayTitle.unmount();
    });

    test('display title select dropdown with new list and some fields present', () => {
        const newModelWithOneField = emptyNewModel.setIn(['domain', 'fields'], List.of(DomainField.create({name: 'dummyField'}))) as ListModel;

        const displayTitle = mount(
            <DisplayTitle model={newModelWithOneField} onSelectChange={jest.fn()} titleColumn={null} />
        );

        expect(displayTitle.find(SELECT_INPUT_PLACEHOLDER_SELECTOR).text()).toEqual('Auto');
        expect(displayTitle.exists(SELECT_INPUT_DISABLED_SELECTOR)).toBeFalsy();
        displayTitle.unmount();
    });

    test("either search indexing options 'index entire list' or 'index each item' may be open, but not both", () => {
        const wrapper = mount(
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

        wrapper.find('.fa-angle-right').at(0).simulate('click');
        expect(wrapper.find(SingleDocumentIndexFields)).toHaveLength(1);
        expect(wrapper.find(SeparateDocumentIndexFields)).toHaveLength(0);

        wrapper.find('.fa-angle-right').at(0).simulate('click');
        expect(wrapper.find(SingleDocumentIndexFields)).toHaveLength(0);
        expect(wrapper.find(SeparateDocumentIndexFields)).toHaveLength(1);
        wrapper.unmount();
    });

    test("setting 'index using custom template' generates a text input field", () => {
        const indexField = mount(
            <IndexField
                name="entireListBodySetting"
                onRadioChange={jest.fn()}
                onInputChange={jest.fn()}
                bodySetting={2}
                bodyTemplate=""
            />
        );

        expect(indexField.find('input.list__advanced-settings-modal__custom-template-text-field')).toHaveLength(1);
        indexField.unmount();
    });
});
