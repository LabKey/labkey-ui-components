import React from 'react';

import { mount, shallow } from 'enzyme';

import DomainForm from '../DomainForm';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { initUnitTestMocks } from '../../../../test/testHelperMocks';

import { Alert } from '../../base/Alert';

import { IssuesListDefPropertiesPanel } from './IssuesListDefPropertiesPanel';
import { IssuesDesignerPanelsImpl, IssuesListDefDesignerPanels } from './IssuesListDefDesignerPanels';
import { IssuesListDefModel } from './models';
import { waitForLifecycle } from "../../../test/enzymeTestHelpers";
import { List } from "immutable";

const emptyNewModel = IssuesListDefModel.create(null, { issueDefName: 'Issues List For Jest' });

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    testMode: true,
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('IssuesListDefDesignerPanel', () => {
    test('new Issue List Definition', async () => {
        const issuesDesignerPanels = shallow(
            <IssuesDesignerPanelsImpl
                {...BASE_PROPS}
                initModel={emptyNewModel}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />);

        await waitForLifecycle(issuesDesignerPanels);

        expect(issuesDesignerPanels).toMatchSnapshot();
    });

    test('visible properties', async () => {
        const issuesDesignerPanels = mount(<IssuesListDefDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);

        await waitForLifecycle(issuesDesignerPanels);

        expect(issuesDesignerPanels.find(IssuesListDefPropertiesPanel)).toHaveLength(1);
        expect(issuesDesignerPanels.find(DomainForm)).toHaveLength(1);
        issuesDesignerPanels.unmount();
    });

    test('open fields panel', async () => {
        const wrapped = mount(<IssuesListDefDesignerPanels {...BASE_PROPS} />);

        await waitForLifecycle(wrapped);

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
