import React from 'react';
import renderer from 'react-test-renderer';

import { mount } from 'enzyme';

import { DomainPanelStatus } from '../models';

import { CollapsiblePanelHeader } from '../CollapsiblePanelHeader';
import getDomainDetailsJSON from '../../../../test/data/issuesListDef-getDomainDetails.json';

import { Alert } from '../../base/Alert';

import { waitForLifecycle } from '../../../test/enzymeTestHelpers';

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

    test('new Issue Def', () => {
        const issuesPropertiesPanel = (
            <IssuesListDefPropertiesPanel {...BASE_PROPS} model={emptyNewModel} onChange={jest.fn()} />
        );

        const tree = renderer.create(issuesPropertiesPanel);
        expect(tree).toMatchSnapshot();
    });

    test('set state for isValid', async () => {
        const wrapped = mount(
            <IssuesListDefPropertiesPanelImpl
                {...BASE_PROPS}
                model={IssuesListDefModel.create(getDomainDetailsJSON)}
                controlledCollapse
                togglePanel={jest.fn()}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        await waitForLifecycle(wrapped);
        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(Alert)).toHaveLength(0);

        expect(wrapped.state()).toHaveProperty('isValid', true);
        wrapped.setState({ isValid: false });
        expect(wrapped.state()).toHaveProperty('isValid', false);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(Alert)).toHaveLength(1);

        wrapped.unmount();
    });
});
