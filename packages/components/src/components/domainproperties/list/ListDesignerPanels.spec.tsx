import React from "react";
import {ListDesignerPanels} from "./ListDesignerPanels";
import {mount} from "enzyme";
import {BasicPropertiesFields} from "./ListPropertiesPanelFormElements";
import toJson from 'enzyme-to-json';
import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const invalidModelHasException = populatedExistingModel.setIn(['domain', 'domainException'], {severity: "Error"}) as ListModel;


describe('ListDesignerPanel', () => { // in progress
    // test('new list', () => {
    //     const listDesignerPanels = mount(
    //         <ListDesignerPanels
    //             onComplete={() => {}}
    //             onCancel={() => {}}
    //             initModel={emptyNewModel}
    //         />
    //     );
    //
    //     expect(toJson(listDesignerPanels)).toMatchSnapshot();
    //     listDesignerPanels.unmount();
    // });
    //
    // test('existing list', () => {
    //     const listDesignerPanels = mount(
    //         <ListDesignerPanels
    //             onComplete={() => {}}
    //             onCancel={() => {}}
    //             initModel={populatedExistingModel}
    //         />
    //     );
    //
    //     expect(toJson(listDesignerPanels)).toMatchSnapshot();
    //     listDesignerPanels.unmount();
    // });
    //
    // test('model with exception', () => {
    //     const listDesignerPanels = mount(
    //         <ListDesignerPanels
    //             onComplete={() => {}}
    //             onCancel={() => {}}
    //             initModel={invalidModelHasException}
    //         />
    //     );
    //
    //     expect(toJson(listDesignerPanels)).toMatchSnapshot();
    //     listDesignerPanels.unmount();
    // });

    test('import file', () => {
    });

    test('open fields panel', () => {
    });
});
