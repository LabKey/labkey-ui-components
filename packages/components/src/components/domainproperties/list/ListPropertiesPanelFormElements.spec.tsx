import React from 'react';
import {ListModel} from "./models";
import { mount } from 'enzyme';
import {
    AllowableActions,
    BasicPropertiesFields,
    BasicPropertiesTitle, CheckBoxRow,
    DescriptionInput,
    NameInput
} from "./ListPropertiesPanelFormElements";
import toJson from 'enzyme-to-json';
import getDomainDetailsJSON from '../../../test/data/property-getDomainDetails.json';


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

describe('BasicPropertiesFields', () => {

    test('new list, default properties', () => {
        const basicPropertiesFields = mount(
            <BasicPropertiesFields
                model={emptyNewModel}
                onInputChange={() => {}}
            />
        );

        expect(toJson(basicPropertiesFields)).toMatchSnapshot();
        basicPropertiesFields.unmount();
    });

    test('existing list, existing properties', () => {
        const basicPropertiesFields = mount(
            <BasicPropertiesFields
                model={populatedExistingModel}
                onInputChange={() => {}}
            />
        );

        expect(toJson(basicPropertiesFields)).toMatchSnapshot();
        basicPropertiesFields.unmount();
    });

    test("visible basic properties", () => {
        const basicPropertiesFields = mount(
            <BasicPropertiesFields
                model={populatedExistingModel}
                onInputChange={() => {}}
            />
        );

        expect(basicPropertiesFields.find(BasicPropertiesTitle)).toHaveLength(1);
        expect(basicPropertiesFields.find(NameInput)).toHaveLength(1);
        expect(basicPropertiesFields.find(DescriptionInput)).toHaveLength(1);
        basicPropertiesFields.unmount();
    });
});

describe('AllowableActions', () => {

    test('new list, default properties', () => {
        const allowableActions = mount(
            <AllowableActions
                model={emptyNewModel}
                onCheckBoxChange={() => {}}
            />
        );

        expect(toJson(allowableActions)).toMatchSnapshot();
        allowableActions.unmount();
    });

    test('existing list, existing properties', () => {
        const allowableActions = mount(
            <AllowableActions
                model={populatedExistingModel}
                onCheckBoxChange={() => {}}
            />
        );

        expect(toJson(allowableActions)).toMatchSnapshot();
        allowableActions.unmount();
    });

    test("visible AllowableActions", () => {
        const allowableActions = mount(
            <AllowableActions
                model={populatedExistingModel}
                onCheckBoxChange={() => {}}
            />
        );

        expect(allowableActions.find(CheckBoxRow)).toHaveLength(3);
        allowableActions.unmount();
    });
});
