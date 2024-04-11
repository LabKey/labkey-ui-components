import React from 'react';
import { act } from 'react-dom/test-utils';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';
import userEvent from '@testing-library/user-event';

import { List } from 'immutable';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

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


    test('visible properties', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ListDesignerPanels {...getDefaultProps()} />
            );
        });

        const panelHeaders = document.getElementsByClassName('domain-panel-header');
        expect(panelHeaders).toHaveLength(2);
        expect(panelHeaders[0].textContent).toBe('List Properties');
        expect(panelHeaders[1].textContent).toBe('Fields');
    });

    test('open fields panel', async () => {
        await act(async () => {
            renderWithAppContext(
                <ListDesignerPanels {...getDefaultProps()} />
            );
        });

        const panelHeaders = document.getElementsByClassName('domain-panel-header');

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);

        await act(async () => {
            userEvent.click(panelHeaders[0]);
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
    });

    test('new list', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
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
        });

        expect(container).toMatchSnapshot();
    });

    test('existing list', async () => {
        const populatedExistingModel = ListModel.create(getDomainDetailsJSON);

        let container;
        await act(async () => {
            container = renderWithAppContext(
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
        });

        expect(container).toMatchSnapshot();
    });
});
