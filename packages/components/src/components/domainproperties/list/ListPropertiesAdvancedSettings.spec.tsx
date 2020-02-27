import React from "react";
import {ListModel} from "./models";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import {
    AdvancedSettings,
    DisplayTitle,
    SearchIndexing,
    SingleDocumentIndexFields,
    SeparateDocumentIndexFields,
    IndexField
} from "./ListPropertiesAdvancedSettings";
import {List} from "immutable";


const DEFAULT_LIST_SETTINGS = {
    "listId" : 0,
    "name" : null,
    "domainId" : 0,
    "keyName" : null,
    "keyType" : null,
    "titleColumn" : null,
    "description" : null,
    "lastIndexed" : null,
    "allowDelete" : true,
    "allowUpload" : true,
    "allowExport" : true,
    "discussionSetting" : 0,
    "entireListTitleTemplate" : "",
    "entireListIndexSetting" : 0,
    "entireListBodySetting" : 0,
    "eachItemTitleTemplate" : "",
    "eachItemBodySetting" : 0,
    "entireListIndex" : false,
    "entireListBodyTemplate" : null,
    "eachItemIndex" : false,
    "eachItemBodyTemplate" : null,
    "fileAttachmentIndex" : false
};

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('AdvancedSettings', () => {

    test('new list, default properties', () => {
        const advancedSettings = mount(
            <AdvancedSettings
                title={"Advanced Settings"}
                model={emptyNewModel}
                applyAdvancedProperties={() => {}}
            />
        );

        expect(toJson(advancedSettings)).toMatchSnapshot();
        advancedSettings.unmount();
    });

    test('existing list, existing properties', () => {
        const advancedSettings = mount(
            <AdvancedSettings
                title={"Advanced Settings"}
                model={populatedExistingModel}
                applyAdvancedProperties={() => {}}
            />
        );

        expect(toJson(advancedSettings)).toMatchSnapshot();
        advancedSettings.unmount();
    });

    test("display title select dropdown with existing list", () => {
        const displayTitle = mount(
            <DisplayTitle
                model={populatedExistingModel}
                onSelectChange={() => {}}
                titleColumn={"Name"}
            />
        );

        expect(displayTitle.find('.Select-value-label').text()).toEqual('Name');
        expect(displayTitle.exists('.is-disabled')).toEqual(false);
    });

    test("display title select dropdown with new list and no fields present", () => {
        const displayTitle = mount(
            <DisplayTitle
                model={emptyNewModel}
                onSelectChange={() => {}}
                titleColumn={null}
            />
        );

        expect(displayTitle.find('.Select-placeholder').text()).toEqual('No fields have been defined yet');
        expect(displayTitle.exists('.is-disabled')).toEqual(true);
    });

    test("display title select dropdown with new list and some fields present", () => {
        const newModelWithOneField = emptyNewModel.setIn(['domain', 'fields'], List(['dummyField'])) as ListModel;

        const displayTitle = mount(
            <DisplayTitle
                model={newModelWithOneField}
                onSelectChange={() => {}}
                titleColumn={null}
            />
        );

        expect(displayTitle.find('.Select-placeholder').text()).toEqual('Auto');
        expect(displayTitle.exists('.is-disabled')).toEqual(false);
    });

    test("either search indexing options 'index entire list' or 'index each item' may be open, but not both", () => {
        const searchIndexing = mount(
            <SearchIndexing
                onRadioChange={() => {}}
                onInputChange={() => {}}
                onCheckboxChange={() => {}}
                entireListIndexSettings={''}
                eachItemIndexSettings={''}
                fileAttachmentIndex={false}
            />
        );

        searchIndexing.setState({expanded: "entireListIndex"});
        expect(searchIndexing.find(SingleDocumentIndexFields)).toHaveLength(1);
        expect(searchIndexing.find(SeparateDocumentIndexFields)).toHaveLength(0);

        searchIndexing.setState({expanded: "eachItemIndex"});
        expect(searchIndexing.find(SingleDocumentIndexFields)).toHaveLength(0);
        expect(searchIndexing.find(SeparateDocumentIndexFields)).toHaveLength(1);
    });

    test("setting 'index using custom template' generates a text input field", () => {
        const indexField = mount(
            <IndexField
                name='entireListBodySetting'
                onRadioChange={() => {}}
                onInputChange={() => {}}
                bodySetting={2}
                bodyTemplate={""}
            />
        );

        expect(indexField.find('input.list__advanced-settings-modal__custom-template-text-field')).toHaveLength(1);
    });
});
