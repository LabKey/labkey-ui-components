import React from 'react';

import { userEvent } from '@testing-library/user-event';

import { List } from 'immutable';

import { waitFor } from '@testing-library/dom';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DEFAULT_LIST_SETTINGS } from '../../../../test/data/constants';
import getDomainDetailsJSON from '../../../../test/data/list-getDomainDetails.json';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { ListModel } from './models';
import { ListDesignerPanels, ListDesignerPanelsProps, ListDesignerPanelsImpl } from './ListDesignerPanels';

describe('ListDesignerPanel', () => {
    function getDefaultProps(): ListDesignerPanelsProps {
        return {
            api: getTestAPIWrapper(jest.fn),
            initModel: ListModel.create(null, DEFAULT_LIST_SETTINGS),
            onCancel: jest.fn(),
            onChange: jest.fn(),
            onComplete: jest.fn(),
        };
    }

    test('visible properties', async () => {
        renderWithAppContext(<ListDesignerPanels {...getDefaultProps()} />);
        await waitFor(() => {
            const panelHeaders = document.getElementsByClassName('domain-panel-header');
            expect(panelHeaders).toHaveLength(2);
            expect(panelHeaders[0].textContent).toBe('List Properties');
            expect(panelHeaders[1].textContent).toBe('Fields');
        });
    });

    test('open fields panel', async () => {
        renderWithAppContext(<ListDesignerPanels {...getDefaultProps()} />);

        await waitFor(() => {
            expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
            expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);
        });
        await userEvent.click(document.getElementsByClassName('domain-panel-header')[0]);

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual('Please correct errors in the properties panel before saving.');
    });

    test('new list', () => {
        <ListDesignerPanelsImpl
            {...getDefaultProps()}
            currentPanelIndex={0}
            firstState
            onFinish={jest.fn()}
            onTogglePanel={jest.fn()}
            setSubmitting={jest.fn()}
            submitting={false}
            validatePanel={0}
            visitedPanels={List()}
        />;

        expect(document.querySelectorAll('.domain-field-row').length).toEqual(0);
    });

    test('existing list', async () => {
        // FIXME: This test has to be comment out, because LookupContextProvider is calling fetchContainers, which is
        //  throwing an error because it has no network connection. What we need is a way for our tests to pass a mocked
        //  version of fetchContainers in LookupProvider. Until then we will have to keep this test commented out.
        // renderWithAppContext(
        //     <ListDesignerPanelsImpl
        //         {...getDefaultProps()}
        //         initModel={ListModel.create(getDomainDetailsJSON)}
        //         currentPanelIndex={0}
        //         firstState
        //         onFinish={jest.fn()}
        //         onTogglePanel={jest.fn()}
        //         setSubmitting={jest.fn()}
        //         submitting={false}
        //         validatePanel={0}
        //         visitedPanels={List()}
        //     />
        // );
        //
        // await waitFor(() => {
        //     expect(document.querySelectorAll('.domain-field-row').length).toEqual(14);
        // });
    });
});
