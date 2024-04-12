import React from 'react';

import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DomainPanelStatus } from '../models';

import getDomainDetailsJSON from '../../../../test/data/issuesListDef-getDomainDetails.json';

import { getIssuesTestAPIWrapper } from './actions';
import { IssuesListDefModel } from './models';
import { IssuesListDefPropertiesPanel, IssuesListDefPropertiesPanelImpl } from './IssuesListDefPropertiesPanel';

const emptyNewModel = IssuesListDefModel.create(null, { issueDefName: 'Issues List For Jest' });

describe('IssuesListDefPropertiesPanel', () => {
    const BASE_PROPS = {
        api: getIssuesTestAPIWrapper(jest.fn),
        panelStatus: 'NONE' as DomainPanelStatus,
        validate: false,
        controlledCollapse: false,
        initCollapsed: false,
        collapsed: false,
    };

    test('new Issue Def', async () => {
        const issuesPropertiesPanel = (
            <IssuesListDefPropertiesPanel {...BASE_PROPS} model={emptyNewModel} onChange={jest.fn()} />
        );
        let container;
        await act(async () => {
            container = renderWithAppContext(issuesPropertiesPanel);
        });

        expect(document.getElementsByClassName('domain-panel-header').length).toBe(1);
        expect(document.getElementsByClassName('alert').length).toBe(0);

        expect(container).toMatchSnapshot();
    });

    test('status TODO', async () => {
        await act(async () => {
            renderWithAppContext(
                <IssuesListDefPropertiesPanelImpl
                    {...BASE_PROPS}
                    model={IssuesListDefModel.create(getDomainDetailsJSON)}
                    controlledCollapse
                    togglePanel={jest.fn()}
                    panelStatus="TODO"
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementsByClassName('domain-panel-header').length).toBe(1);
        expect(document.getElementsByClassName('alert').length).toBe(0);
        expect(document.getElementsByClassName('fa-exclamation-circle').length).toBe(1);
        expect(document.getElementsByClassName('fa-check-circle').length).toBe(0);
    });
});
