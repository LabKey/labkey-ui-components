import React from 'react';
import { mount } from 'enzyme';

import { EntityDetailsForm } from '../entities/EntityDetailsForm';
import { CollapsiblePanelHeader } from '../CollapsiblePanelHeader';

import { DomainPanelStatus } from '../models';
import getDomainDetailsJSON from '../../../../test/data/dataclass-getDomainDetails.json';

import { QuerySelect } from '../../forms/QuerySelect';
import { Alert } from '../../base/Alert';

import { BasePropertiesPanel } from '../BasePropertiesPanel';

import { HelpTopicURL } from '../HelpTopicURL';

import { DataClassModel } from './models';
import { DataClassPropertiesPanelImpl } from './DataClassPropertiesPanel';

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

describe('DataClassPropertiesPanel', () => {
    test('default properties', () => {
        const wrapped = mount(
            <DataClassPropertiesPanelImpl {...BASE_PROPS} model={DataClassModel.create({})} onChange={jest.fn()} />
        );

        expect(wrapped.find(BasePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(BasePropertiesPanel).prop('title')).toBe('Data Class Properties');
        expect(wrapped.find(HelpTopicURL)).toHaveLength(1);
        expect(wrapped.find('.entity-form--headerhelp')).toHaveLength(0);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm).prop('nameExpressionInfoUrl')).toBe(
            'https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=dataClass#name'
        );
        expect(wrapped.find('input')).toHaveLength(4);
        expect(wrapped.find('textarea')).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(0);

        wrapped.unmount();
    });

    test('custom properties', () => {
        const wrapped = mount(
            <DataClassPropertiesPanelImpl
                {...BASE_PROPS}
                model={DataClassModel.create({})}
                onChange={jest.fn()}
                nounSingular="Source"
                nounPlural="Sources"
                nameExpressionInfoUrl="https://www.labkey.org/Documentation"
                nameExpressionPlaceholder="name expression placeholder test"
                headerText="header text test"
                appPropertiesOnly={true}
                panelStatus="COMPLETE"
            />
        );

        expect(wrapped.find(BasePropertiesPanel)).toHaveLength(1);
        expect(wrapped.find(BasePropertiesPanel).prop('title')).toBe('Source Properties');
        expect(wrapped.find(HelpTopicURL)).toHaveLength(1);
        expect(wrapped.find('.entity-form--headerhelp')).toHaveLength(1);
        expect(wrapped.find('.entity-form--headerhelp').text()).toBe('header text test');

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm).prop('nameExpressionInfoUrl')).toBe(
            'https://www.labkey.org/Documentation'
        );
        expect(wrapped.find('input')).toHaveLength(2);
        expect(wrapped.find('textarea')).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(0);
        expect(wrapped.find(Alert)).toHaveLength(0);
    });

    test('set state for isValid', () => {
        const wrapped = mount(
            <DataClassPropertiesPanelImpl
                {...BASE_PROPS}
                model={DataClassModel.create(getDomainDetailsJSON)}
                controlledCollapse={true}
                togglePanel={jest.fn()}
                panelStatus="TODO"
                onChange={jest.fn()}
            />
        );

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(0);

        expect(wrapped.state()).toHaveProperty('isValid', true);
        wrapped.setState({ isValid: false });
        expect(wrapped.state()).toHaveProperty('isValid', false);

        expect(wrapped.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(wrapped.find(EntityDetailsForm)).toHaveLength(1);
        expect(wrapped.find(QuerySelect)).toHaveLength(2);
        expect(wrapped.find(Alert)).toHaveLength(1);

        wrapped.unmount();
    });
});
