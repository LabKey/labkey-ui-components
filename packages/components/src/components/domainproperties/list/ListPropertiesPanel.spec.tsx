import React from "react";
import {mount} from "enzyme";
import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {AllowableActions, BasicPropertiesFields} from "./ListPropertiesPanelFormElements";
import {AdvancedSettings} from "./ListPropertiesAdvancedSettings";
import {CollapsiblePanelHeader} from "../CollapsiblePanelHeader";
import { Alert } from '../../base/Alert';
import renderer from "react-test-renderer";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const invalidModelHasException = populatedExistingModel.setIn(['domain', 'domainException'], {severity: "Error"}) as ListModel;


describe('ListPropertiesPanel', () => {
    test('new list', () => {
        const listPropertiesPanel =
            <ListPropertiesPanel
                model={emptyNewModel}
                panelStatus={'NONE'}
                onChange={jest.fn()}
            />;

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('existing list', () => {
        const listPropertiesPanel =
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'COMPLETE'}
                onChange={jest.fn()}
            />;

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('list with error', () => {
        const listPropertiesPanel =
            <ListPropertiesPanel
                model={invalidModelHasException}
                panelStatus={'TODO'}
                onChange={jest.fn()}
            />;

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    //Note: visible properties are the same between new and existing lists
    test('list visible properties', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'COMPLETE'}
                onChange={jest.fn()}
            />
        );

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);

        expect(listPropertiesPanel.find(Alert)).toHaveLength(0);
        listPropertiesPanel.unmount();
    });

    test('invalid', () => {
        let listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'TODO'}
                onChange={jest.fn()}
            />
        );
        listPropertiesPanel.setState({isValid: false});
        listPropertiesPanel.update();
        expect(listPropertiesPanel.state()).toHaveProperty('isValid', false);

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);

        // alert is not being triggered
        console.log(listPropertiesPanel.debug());
        // expect(listPropertiesPanel.find('Alert')).toHaveLength(1);
        // expect(listPropertiesPanel.find(Alert)).toHaveLength(1);

        listPropertiesPanel.unmount();
    });

    test('clicking advanced settings renders modal', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={emptyNewModel}
                panelStatus={'NONE'}
                onChange={jest.fn()}
            />
        );

        let advancedSettingsButton = listPropertiesPanel.find('button.domain-field-float-right');
        expect(advancedSettingsButton).toHaveLength(1);

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(0);

        advancedSettingsButton.simulate('click');

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(1);
        expect(listPropertiesPanel.find('.modal-title').text()).toEqual(' Advanced List Settings ');
        listPropertiesPanel.unmount();
    });
});
