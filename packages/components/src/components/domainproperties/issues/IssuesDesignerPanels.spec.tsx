import React from 'react';
import renderer from 'react-test-renderer';

import { DEFAULT_ISSUES_DESIGNER_SETTINGS } from '../../../test/data/constants';

import {IssuesModel} from './models';
import {IssuesDesignerPanels} from "./IssuesDesignerPanels";
import {mount} from "enzyme";

import DomainForm from "../DomainForm";
import {IssuesPropertiesPanel} from "./IssuesPropertiesPanel";

const emptyNewModel = IssuesModel.create(null, DEFAULT_ISSUES_DESIGNER_SETTINGS);

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
};

describe('IssuesDesignerPanel', () => {
    test('new Issue Definition', () => {
        const issuesDesignerPanels = <IssuesDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />;

        const tree = renderer.create(issuesDesignerPanels).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('visible properties', () => {
        const issuesDesignerPanels = mount(<IssuesDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);

        expect(issuesDesignerPanels.find(IssuesPropertiesPanel)).toHaveLength(1);
        expect(issuesDesignerPanels.find(DomainForm)).toHaveLength(1);
        issuesDesignerPanels.unmount();
    });
});
