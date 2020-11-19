import React from 'react';
import { Alert } from 'react-bootstrap';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';
import DomainForm from '../DomainForm';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { ListPropertiesPanel } from './ListPropertiesPanel';
import { ListModel } from './models';
import { ListDesignerPanels } from './ListDesignerPanels';
import { initUnitTestMocks, sleep } from "../../../testHelpers";

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

const BASE_PROPS = {
    onComplete: jest.fn(),
    onCancel: jest.fn(),
};

beforeAll(() => {
    initUnitTestMocks();
});

describe('ListDesignerPanel', () => {
    test('new list', () => {
        const listDesignerPanels = <ListDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />;

        const tree = renderer.create(listDesignerPanels).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('existing list', async () => {
        const listDesignerPanels = mount(<ListDesignerPanels {...BASE_PROPS} initModel={populatedExistingModel} />);
        await sleep();

        expect(listDesignerPanels).toMatchSnapshot();
        listDesignerPanels.unmount();
    });

    test('visible properties', async () => {
        const listDesignerPanels = mount(<ListDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);
        await sleep();

        expect(listDesignerPanels.find(ListPropertiesPanel)).toHaveLength(1);
        expect(listDesignerPanels.find(DomainForm)).toHaveLength(1);
        listDesignerPanels.unmount();
    });

    test('open fields panel', async () => {
        const listDesignerPanels = mount(<ListDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);
        await sleep();

        const panelHeader = listDesignerPanels.find('div#domain-header');

        expect(listDesignerPanels.find('#domain-header').at(2).hasClass('domain-panel-header-collapsed')).toBeTruthy();

        panelHeader.simulate('click');

        expect(listDesignerPanels.find('#domain-header').at(2).hasClass('domain-panel-header-expanded')).toBeTruthy();

        expect(listDesignerPanels.find(Alert)).toHaveLength(2);
        expect(listDesignerPanels.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(listDesignerPanels.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        listDesignerPanels.unmount();
    });
});
