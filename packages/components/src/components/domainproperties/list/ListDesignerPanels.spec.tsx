import React from "react";
import {ListDesignerPanels} from "./ListDesignerPanels";
import {mount} from "enzyme";
import toJson from 'enzyme-to-json';
import {ListModel} from "./models";
import {DEFAULT_LIST_SETTINGS} from "../../../test/data/constants";
import getDomainDetailsJSON from "../../../test/data/property-getDomainDetails.json";
import DomainForm from "../DomainForm";
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {Alert} from "react-bootstrap";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

describe('ListDesignerPanel', () => { // in progress
    test('new list', () => {
        const listDesignerPanels = mount(
            <ListDesignerPanels
                onComplete={() => {}}
                onCancel={() => {}}
                initModel={emptyNewModel}
            />
        );

        expect(toJson(listDesignerPanels)).toMatchSnapshot();
        listDesignerPanels.unmount();
    });

    test('existing list', () => {
        const listDesignerPanels = mount(
            <ListDesignerPanels
                onComplete={() => {}}
                onCancel={() => {}}
                initModel={populatedExistingModel}
            />
        );

        expect(toJson(listDesignerPanels)).toMatchSnapshot();
        listDesignerPanels.unmount();
    });

    test('visible properties', () => {
        const listDesignerPanels = mount(
            <ListDesignerPanels
                onComplete={() => {}}
                onCancel={() => {}}
                initModel={emptyNewModel}
            />
        );

        expect(listDesignerPanels.find(ListPropertiesPanel)).toHaveLength(1);
        expect(listDesignerPanels.find(DomainForm)).toHaveLength(1);
        expect(listDesignerPanels.find('.domain-assay-buttons')).toHaveLength(1);
    });

    test('open fields panel', () => {
        const listDesignerPanels = mount(
            <ListDesignerPanels
                onComplete={() => {}}
                onCancel={() => {}}
                initModel={emptyNewModel}
            />
        );

        const panelHeader = listDesignerPanels.find('div#domain-header');

        expect(
            listDesignerPanels
                .find('#domain-header')
                .at(2)
                .hasClass('domain-panel-header-collapsed'))
            .toBeTruthy();

        panelHeader.simulate('click');

        expect(
            listDesignerPanels
                .find('#domain-header')
                .at(2)
                .hasClass('domain-panel-header-expanded'))
            .toBeTruthy();


        expect(listDesignerPanels.find(Alert)).toHaveLength(2);
        expect(listDesignerPanels.find(Alert).at(0).text()).toEqual('Contains errors or is missing required values.');
        expect(listDesignerPanels.find(Alert).at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
    });
});
