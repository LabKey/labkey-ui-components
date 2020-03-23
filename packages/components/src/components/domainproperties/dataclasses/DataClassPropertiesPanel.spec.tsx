import React from "react";
import renderer from "react-test-renderer";
import { mount } from "enzyme";
import { DataClassModel } from "./models";
import { DataClassPropertiesPanel, DataClassPropertiesPanelImpl } from "./DataClassPropertiesPanel";
import { Alert } from "../../base/Alert";
import { EntityDetailsForm } from "../entities/EntityDetailsForm";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { QuerySelect } from "../../forms/QuerySelect";
import getDomainDetailsJSON from "../../../test/data/dataclass-getDomainDetails.json";

describe('DataClassPropertiesPanel', () => {

    test('default properties', () => {
        const form =
            <DataClassPropertiesPanel
                model={DataClassModel.create({})}
                onChange={jest.fn()}
            />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form =
            <DataClassPropertiesPanel
                model={DataClassModel.create({})}
                onChange={jest.fn()}
                nounSingular={'Source'}
                nounPlural={'Sources'}
                nameExpressionInfoUrl={'https://www.labkey.org/Documentation'}
                nameExpressionPlaceholder={'name expression placeholder test'}
                headerText={'header text test'}
                useTheme={true}
                appPropertiesOnly={true}
                panelStatus={'COMPLETE'}

            />;

        const tree = renderer.create(form).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('set state for isValid', () => {
        let wrapped = mount(
            <DataClassPropertiesPanelImpl
                model={DataClassModel.create(getDomainDetailsJSON)}
                panelStatus={'TODO'}
                onChange={jest.fn()}
            />
        );

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(0);

        expect(wrapped.state()).toHaveProperty('isValid', true);
        wrapped.setState({isValid: false});
        expect(wrapped.state()).toHaveProperty('isValid', false);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(1);

        wrapped.unmount();
    });
});
