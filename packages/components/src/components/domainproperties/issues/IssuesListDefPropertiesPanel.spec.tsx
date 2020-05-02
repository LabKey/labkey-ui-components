import React from 'react';
import renderer from 'react-test-renderer';

import { DEFAULT_LIST_SETTINGS } from '../../../test/data/constants';

import { DomainPanelStatus } from '../models';
import {IssuesListDefPropertiesPanel, IssuesListDefPropertiesPanelImpl} from "./IssuesListDefPropertiesPanel";
import {IssuesListDefModel} from "./models";
import {mount} from "enzyme";
import {Alert, QuerySelect} from "../../..";
import {CollapsiblePanelHeader} from "../CollapsiblePanelHeader";
import {EntityDetailsForm} from "../entities/EntityDetailsForm";
import getDomainDetailsJSON from '../../../test/data/issuesListDef-getdomainDetails.json'

const emptyNewModel = IssuesListDefModel.create(null, DEFAULT_LIST_SETTINGS);

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    useTheme: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

describe('IssuesListDefPropertiesPanel', () => {
    test('new Issue Def', () => {
        const issuesPropertiesPanel = (
            <IssuesListDefPropertiesPanel {...BASE_PROPS} model={emptyNewModel} onChange={jest.fn()} />
        );

        const tree = renderer.create(issuesPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('set state for isValid', () => {
        const wrapped = mount(
            <IssuesListDefPropertiesPanelImpl
                {...BASE_PROPS}
                model={IssuesListDefModel.create(getDomainDetailsJSON)}
                controlledCollapse={true}
                togglePanel={jest.fn()}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(Alert)).toHaveLength(0);

        expect(wrapped.state()).toHaveProperty('isValid', true);
        wrapped.setState({ isValid: false });
        expect(wrapped.state()).toHaveProperty('isValid', false);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(Alert)).toHaveLength(1);

        wrapped.unmount();
    });
});
