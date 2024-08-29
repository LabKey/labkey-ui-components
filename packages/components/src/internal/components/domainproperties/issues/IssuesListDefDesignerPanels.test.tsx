import React from 'react';

import userEvent from '@testing-library/user-event';

import { List } from 'immutable';

import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { IssuesDesignerPanelsImpl, IssuesListDefDesignerPanels } from './IssuesListDefDesignerPanels';
import { IssuesListDefModel } from './models';
import { getIssuesTestAPIWrapper } from './actions';

describe('IssuesListDefDesignerPanel', () => {
    const emptyNewModel = IssuesListDefModel.create(null, { issueDefName: 'Issues List For Jest' });

    const BASE_PROPS = {
        api: getIssuesTestAPIWrapper(jest.fn),
        onComplete: jest.fn(),
        onCancel: jest.fn(),
    };

    test('new Issue List Definition', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <IssuesDesignerPanelsImpl
                    {...BASE_PROPS}
                    initModel={emptyNewModel}
                    currentPanelIndex={0}
                    firstState
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

    test('visible properties', async () => {
        await act(async () => {
            renderWithAppContext(<IssuesListDefDesignerPanels {...BASE_PROPS} initModel={emptyNewModel} />);
        });
        const panels = document.getElementsByClassName('domain-form-panel');
        expect(panels).toHaveLength(2);
        expect(panels[0].querySelector('.domain-panel-title').textContent).toBe(
            'Issues List For Jest - Issues List Properties'
        );
        expect(panels[1].querySelector('.domain-panel-title').textContent).toBe('Fields');
    });

    test('open fields panel', async () => {
        await act(async () => {
            renderWithAppContext(<IssuesListDefDesignerPanels {...BASE_PROPS} />);
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);

        await act(() => userEvent.click(document.querySelector('.domain-panel-header')));

        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toEqual('Please correct errors in the properties panel before saving.');
    });
});
