import React from "react";
import { mount } from "enzyme";
import renderer from 'react-test-renderer';
import toJson from "enzyme-to-json";
import { DataClassDesigner } from "./DataClassDesigner";
import { DataClassModel } from "./models";
import { Alert } from "../../base/Alert";
import { PROPERTIES_PANEL_ERROR_MSG } from "../constants";
import getDomainDetailsJSON from "../../../test/data/dataclass-getDomainDetails.json";


describe('DataClassDesigner', () => {

    test('default properties', () => {
        const form =
            <DataClassDesigner
                onComplete={jest.fn()}
                onCancel={jest.fn()}
            />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form =
            <DataClassDesigner
                onComplete={jest.fn()}
                onCancel={jest.fn()}
                nounSingular={'Source'}
                nounPlural={'Sources'}
                nameExpressionInfoUrl={'https://www.labkey.org/Documentation'}
                nameExpressionPlaceholder={'name expression placeholder test'}
                headerText={'header text test'}
                useTheme={true}
                containerTop={10}
                appPropertiesOnly={true}
                successBsStyle={'primary'}
            />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('initModel', () => {
        const form =
            <DataClassDesigner
                onComplete={jest.fn()}
                onCancel={jest.fn()}
                initModel={DataClassModel.create(getDomainDetailsJSON)}
            />;
        const wrapped = mount(form);

        expect(toJson(wrapped)).toMatchSnapshot();
        wrapped.unmount();
    });

    test('open fields panel', () => {
        const wrapped = mount(
            <DataClassDesigner
                onComplete={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual('Please correct errors in the properties panel before saving.');
        wrapped.unmount();
    });
});
