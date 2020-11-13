import React from 'react';
import renderer from 'react-test-renderer';

import { mount } from 'enzyme';

import DomainForm from '../DomainForm';

import { Alert } from '../../../..';
import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { IssuesListDefPropertiesPanel } from './IssuesListDefPropertiesPanel';
import { IssuesListDefDesignerPanels } from './IssuesListDefDesignerPanels';
import { IssuesListDefModel } from './models';
import { initUnitTestMocks, sleep } from "../../../testHelpers";

const emptyNewModel = IssuesListDefModel.create(null, { issueDefName: 'Issues List For Jest' });

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('IssuesListDefDesignerPanel', () => {
    test('new Issue List Definition', () => {
        const issuesDesignerPanels = <IssuesListDefDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />;

        const tree = renderer.create(issuesDesignerPanels).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('visible properties', async () => {
        const issuesDesignerPanels = mount(<IssuesListDefDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);
        await sleep();

        expect(issuesDesignerPanels.find(IssuesListDefPropertiesPanel)).toHaveLength(1);
        expect(issuesDesignerPanels.find(DomainForm)).toHaveLength(1);
        issuesDesignerPanels.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mount(<IssuesListDefDesignerPanels {...BASE_PROPS} />);
        await sleep();

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        wrapped.unmount();
    });

    // TODO: Add test cases for editing Issues List Def in the near future
});
