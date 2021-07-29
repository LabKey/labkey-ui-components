import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { Alert, QuerySelect } from '../../../..';
import { EntityDetailsForm } from '../entities/EntityDetailsForm';
import { CollapsiblePanelHeader } from '../CollapsiblePanelHeader';

import { DomainPanelStatus } from '../models';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';

import { DataClassPropertiesPanel, DataClassPropertiesPanelImpl } from './DataClassPropertiesPanel';
import { DataClassModel } from './models';

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    useTheme: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

describe('DataClassPropertiesPanel', () => {
    test('default properties', () => {
        const form = (
            <DataClassPropertiesPanel {...BASE_PROPS} model={DataClassModel.create({})} onChange={jest.fn()} />
        );

        const tree = renderer.create(form);
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const form = (
            <DataClassPropertiesPanel
                {...BASE_PROPS}
                model={DataClassModel.create({})}
                onChange={jest.fn()}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                useTheme={true}
                appPropertiesOnly={true}
                panelStatus="COMPLETE"
            />
        );

        const tree = renderer.create(form);
        expect(tree).toMatchSnapshot();
    });

    test('set state for isValid', () => {
        const wrapped = mount(
            <DataClassPropertiesPanelImpl
                {...BASE_PROPS}
                model={DataClassModel.create(getDomainDetailsJSON)}
                controlledCollapse={true}
                togglePanel={jest.fn()}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(0);

        expect(wrapped.state()).toHaveProperty('isValid', true);
        wrapped.setState({ isValid: false });
        expect(wrapped.state()).toHaveProperty('isValid', false);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(1);

        wrapped.unmount();
    });
});
