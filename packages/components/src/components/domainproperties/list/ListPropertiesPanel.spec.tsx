import React from "react";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import {ListPropertiesPanel} from "./ListPropertiesPanel";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const invalidModelHasException = populatedExistingModel.setIn(['domain', 'domainException'], {severity: "Error"}) as ListModel;


describe('ListPropertiesPanel', () => { // in progress
    test('new list', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={emptyNewModel}
                panelStatus={'NONE'}
                onChange={() => {}}
            />
        );

        expect(toJson(listPropertiesPanel)).toMatchSnapshot();
        listPropertiesPanel.unmount();
    });

    test('existing list', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'COMPLETE'}
                onChange={() => {}}
            />
        );

        expect(toJson(listPropertiesPanel)).toMatchSnapshot();
        listPropertiesPanel.unmount();
    });

    test('invalid', () => {
    });
});
