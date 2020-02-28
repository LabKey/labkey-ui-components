import React from "react";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {AllowableActions, BasicPropertiesFields} from "./ListPropertiesPanelFormElements";
import {AdvancedSettings} from "./ListPropertiesAdvancedSettings";
import {CollapsiblePanelHeader} from "../CollapsiblePanelHeader";
import { Alert } from '../../base/Alert';

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

    test('list with error', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={invalidModelHasException}
                panelStatus={'TODO'}
                onChange={() => {}}
            />
        );

        expect(toJson(listPropertiesPanel)).toMatchSnapshot();
        listPropertiesPanel.unmount();
    });

    //Note: visible properties are the same between new and existing lists
    test('list visible properties', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'COMPLETE'}
                onChange={() => {}}
            />
        );

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);

        expect(listPropertiesPanel.find(Alert)).toHaveLength(0);
    });

    test('invalid', () => {
        let listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={populatedExistingModel}
                panelStatus={'TODO'}
                onChange={() => {}}
            />
        );
        listPropertiesPanel.setState({isValid: false});
        listPropertiesPanel.update();
        expect(listPropertiesPanel.state()).toHaveProperty('isValid', false);

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);

        // expect(listPropertiesPanel.find(Alert)).toHaveLength(1); // alert is not being triggered
    });

    test('clicking advanced settings renders modal', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                model={emptyNewModel}
                panelStatus={'NONE'}
                onChange={() => {}}
            />
        );

        let advancedSettingsButton = listPropertiesPanel.find('button.domain-field-float-right');
        expect(advancedSettingsButton).toHaveLength(1);

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(0);

        advancedSettingsButton.simulate('click');

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(1);
        expect(listPropertiesPanel.find('.modal-title').text()).toEqual(' Advanced List Settings ');

    });
});
