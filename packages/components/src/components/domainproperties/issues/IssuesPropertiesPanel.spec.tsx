import React from 'react';
import renderer from 'react-test-renderer';

import { DEFAULT_LIST_SETTINGS } from '../../../test/data/constants';

import { DomainPanelStatus } from '../models';
import {IssuesPropertiesPanel} from "./IssuesPropertiesPanel";
import {IssuesModel} from "./models";

const emptyNewModel = IssuesModel.create(null, DEFAULT_LIST_SETTINGS);

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    useTheme: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

describe('IssuesPropertiesPanel', () => {
    test('new Issue Def', () => {
        const issuesPropertiesPanel = (
            <IssuesPropertiesPanel {...BASE_PROPS} model={emptyNewModel} panelStatus="NONE" onChange={jest.fn()} />
        );

        const tree = renderer.create(issuesPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
