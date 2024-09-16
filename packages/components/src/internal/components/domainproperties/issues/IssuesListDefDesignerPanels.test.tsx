import React, { act } from 'react';

import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { MockLookupProvider } from '../../../../test/components/Lookup';

import { IssuesListDefDesignerPanels } from './IssuesListDefDesignerPanels';
import { IssuesListDefModel } from './models';
import { getIssuesTestAPIWrapper } from './actions';
import { waitFor } from '@testing-library/dom';

describe('IssuesListDefDesignerPanel', () => {
    const emptyNewModel = IssuesListDefModel.create(null, { issueDefName: 'Issues List For Jest' });

    const BASE_PROPS = {
        api: getIssuesTestAPIWrapper(jest.fn),
        onComplete: jest.fn(),
        onCancel: jest.fn(),
    };

    test('visible properties', async () => {
        act(() => {
            renderWithAppContext(
                <MockLookupProvider>
                    <IssuesListDefDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />
                </MockLookupProvider>
            );
        });
        await waitFor(() => {
            act(() => {
                const panels = document.getElementsByClassName('domain-form-panel');
                expect(panels).toHaveLength(2);
                expect(panels[0].querySelector('.domain-panel-title').textContent).toBe(
                    'Issues List For Jest - Issues List Properties'
                );
                expect(panels[1].querySelector('.domain-panel-title').textContent).toBe('Fields');
            });
        });
    });

    test('open fields panel', async () => {
        renderWithAppContext(
            <MockLookupProvider>
                <IssuesListDefDesignerPanels {...BASE_PROPS} />
            </MockLookupProvider>
        );
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);

        await userEvent.click(document.querySelector('.domain-panel-header'));

        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual('Please correct errors in the properties panel before saving.');
    });
});
