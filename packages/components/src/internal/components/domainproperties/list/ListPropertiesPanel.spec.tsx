import React from 'react';
import { mount } from 'enzyme';

import renderer from 'react-test-renderer';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';

import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { CollapsiblePanelHeader } from '../CollapsiblePanelHeader';

import { DomainPanelStatus } from '../models';

import { Alert } from '../../base/Alert';

import { ListModel } from './models';

import { ListPropertiesPanel, ListPropertiesPanelImpl } from './ListPropertiesPanel';
import { AllowableActions, BasicPropertiesFields } from './ListPropertiesPanelFormElements';
import { AdvancedSettings } from './ListPropertiesAdvancedSettings';

const emptyNewModel = ListModel.create(null, DEFAULT_LIST_SETTINGS);
const populatedExistingModel = ListModel.create(getDomainDetailsJSON);
const invalidModelHasException = populatedExistingModel.setIn(['domain', 'domainException'], {
    severity: 'Error',
}) as ListModel;

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

describe('ListPropertiesPanel', () => {
    test('new list', () => {
        const listPropertiesPanel = (
            <ListPropertiesPanel {...BASE_PROPS} model={emptyNewModel} panelStatus="NONE" onChange={jest.fn()} />
        );

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('existing list', () => {
        const listPropertiesPanel = (
            <ListPropertiesPanel
                {...BASE_PROPS}
                model={populatedExistingModel}
                panelStatus="COMPLETE"
                onChange={jest.fn()}
            />
        );

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('list with error', () => {
        const listPropertiesPanel = (
            <ListPropertiesPanel
                {...BASE_PROPS}
                model={invalidModelHasException}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        const tree = renderer.create(listPropertiesPanel).toJSON();
        expect(tree).toMatchSnapshot();
    });

    // Note: visible properties are the same between new and existing lists
    test('list visible properties', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel
                {...BASE_PROPS}
                model={populatedExistingModel}
                panelStatus="COMPLETE"
                onChange={jest.fn()}
            />
        );

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);

        expect(listPropertiesPanel.find(Alert)).toHaveLength(0);
        listPropertiesPanel.unmount();
    });

    test('set state for isValid', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanelImpl
                {...BASE_PROPS}
                model={populatedExistingModel}
                togglePanel={jest.fn()}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(listPropertiesPanel.find(Alert)).toHaveLength(0);

        expect(listPropertiesPanel.state()).toHaveProperty('isValid', true);
        listPropertiesPanel.setState({ isValid: false });
        expect(listPropertiesPanel.state()).toHaveProperty('isValid', false);

        expect(listPropertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(listPropertiesPanel.find(AllowableActions)).toHaveLength(1);
        expect(listPropertiesPanel.find(AdvancedSettings)).toHaveLength(1);
        expect(listPropertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(listPropertiesPanel.find(Alert)).toHaveLength(1);

        listPropertiesPanel.unmount();
    });

    test('clicking advanced settings renders modal', () => {
        const listPropertiesPanel = mount(
            <ListPropertiesPanel {...BASE_PROPS} model={emptyNewModel} panelStatus="NONE" onChange={jest.fn()} />
        );

        const advancedSettingsButton = listPropertiesPanel.find('button.domain-field-float-right');
        expect(advancedSettingsButton).toHaveLength(1);

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(0);

        advancedSettingsButton.simulate('click');

        expect(listPropertiesPanel.find('.modal-title')).toHaveLength(1);
        expect(listPropertiesPanel.find('.modal-title').text()).toEqual(' Advanced List Settings ');
        listPropertiesPanel.unmount();
    });
});
