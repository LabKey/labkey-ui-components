import React from 'react';
import { mount, shallow } from 'enzyme';

import { List } from 'immutable';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';
import DomainForm from '../DomainForm';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { Alert } from '../../base/Alert';

import { ListPropertiesPanel } from './ListPropertiesPanel';
import { ListModel } from './models';
import { ListDesignerPanels, ListDesignerPanelsImpl } from './ListDesignerPanels';

describe('ListDesignerPanel', () => {
    const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);

    function getDefaultProps() {
        return {
            initModel: emptyNewModel,
            onComplete: jest.fn(),
            onCancel: jest.fn(),
            onChange: jest.fn(),
            testMode: true,
        };
    }

    test('new list', async () => {
        const listDesignerPanels = (
            <ListDesignerPanelsImpl
                {...getDefaultProps()}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );

        const tree = shallow(listDesignerPanels);

        await waitForLifecycle(tree);

        expect(tree).toMatchSnapshot();
    });

    test('existing list', async () => {
        const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

        const listDesignerPanels = shallow(
            <ListDesignerPanelsImpl
                {...getDefaultProps()}
                initModel={populatedExistingModel}
                currentPanelIndex={0}
                firstState={true}
                onFinish={jest.fn()}
                onTogglePanel={jest.fn()}
                setSubmitting={jest.fn()}
                submitting={false}
                validatePanel={0}
                visitedPanels={List()}
            />
        );
        await waitForLifecycle(listDesignerPanels);

        expect(listDesignerPanels).toMatchSnapshot();
        listDesignerPanels.unmount();
    });

    test('visible properties', async () => {
        const listDesignerPanels = mount(<ListDesignerPanels {...getDefaultProps()} />);
        await waitForLifecycle(listDesignerPanels);

        expect(listDesignerPanels.find(ListPropertiesPanel)).toHaveLength(1);
        expect(listDesignerPanels.find(DomainForm)).toHaveLength(1);
        listDesignerPanels.unmount();
    });

    test('open fields panel', async () => {
        const listDesignerPanels = mount(<ListDesignerPanels {...getDefaultProps()} />);
        await waitForLifecycle(listDesignerPanels);

        const panelHeader = listDesignerPanels.find('div#domain-header');

        expect(listDesignerPanels.find('#domain-header').at(1).hasClass('domain-panel-header-collapsed')).toBeTruthy();

        panelHeader.simulate('click');

        expect(listDesignerPanels.find('#domain-header').at(1).hasClass('domain-panel-header-expanded')).toBeTruthy();

        expect(listDesignerPanels.find(Alert)).toHaveLength(2);
        expect(listDesignerPanels.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(listDesignerPanels.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        listDesignerPanels.unmount();
    });
});
