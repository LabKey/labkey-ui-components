import React, { act } from 'react';
import { userEvent } from '@testing-library/user-event';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';

import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { DomainPanelStatus } from '../models';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { ListModel } from './models';

import { ListPropertiesPanel, ListPropertiesPanelImpl } from './ListPropertiesPanel';

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
    test('new list', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ListPropertiesPanel {...BASE_PROPS} model={emptyNewModel} panelStatus="NONE" onChange={jest.fn()} />
            );
        });

        expect(container).toMatchSnapshot();
    });

    test('existing list', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ListPropertiesPanel
                    {...BASE_PROPS}
                    model={populatedExistingModel}
                    panelStatus="COMPLETE"
                    onChange={jest.fn()}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

    test('list with error', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ListPropertiesPanel
                    {...BASE_PROPS}
                    model={invalidModelHasException}
                    panelStatus="TODO"
                    onChange={jest.fn()}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

    // Note: visible properties are the same between new and existing lists
    test('list visible properties', async () => {
        await act(async () => {
            renderWithAppContext(
                <ListPropertiesPanel
                    {...BASE_PROPS}
                    model={populatedExistingModel}
                    panelStatus="COMPLETE"
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementsByClassName('domain-field-section-heading')).toHaveLength(2);
        expect(document.getElementsByClassName('list__properties__allowable-actions')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-field-float-right')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header')).toHaveLength(1);
        expect(document.getElementsByClassName('alert')).toHaveLength(0);
    });

    test('Status TODO', async () => {
        await act(async () => {
            renderWithAppContext(
                <ListPropertiesPanelImpl
                    {...BASE_PROPS}
                    model={populatedExistingModel}
                    togglePanel={jest.fn()}
                    panelStatus="TODO"
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementsByClassName('domain-field-section-heading')).toHaveLength(2);
        expect(document.getElementsByClassName('list__properties__allowable-actions')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-field-float-right')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header')).toHaveLength(1);
        expect(document.getElementsByClassName('alert')).toHaveLength(0);
        expect(document.getElementsByClassName('fa-exclamation-circle').length).toBe(1);
        expect(document.getElementsByClassName('fa-check-circle')).toHaveLength(0);
    });

    test('clicking advanced settings renders modal', async () => {
        await act(async () => {
            renderWithAppContext(
                <ListPropertiesPanel {...BASE_PROPS} model={emptyNewModel} panelStatus="NONE" onChange={jest.fn()} />
            );
        });

        const advancedSettingsButton = document.querySelector('button.domain-field-float-right');
        expect(document.getElementsByClassName('modal-title')).toHaveLength(0);

        await act(() => userEvent.click(advancedSettingsButton));

        expect(document.getElementsByClassName('modal-title')).toHaveLength(1);
        expect(document.querySelector('.modal-title').textContent).toEqual('Advanced List Settings');
    });
});
