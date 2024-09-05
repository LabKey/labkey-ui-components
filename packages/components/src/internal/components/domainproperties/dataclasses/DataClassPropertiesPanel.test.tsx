import React from 'react';
import { act } from '@testing-library/react';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DomainPanelStatus } from '../models';

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
    test('default properties', async () => {
        await act(async () => {
            renderWithAppContext(
                <DataClassPropertiesPanelImpl {...BASE_PROPS} model={DataClassModel.create({})} onChange={jest.fn()} />
            );
        });

        expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(1);
        expect(document.querySelector('.domain-panel-title').textContent).toBe('Data Class Properties');
        expect(document.getElementsByClassName('domain-field-float-right')).toHaveLength(1); // help link
        expect(document.getElementsByClassName('entity-form--headerhelp')).toHaveLength(0);

        expect(document.getElementsByClassName('domain-panel-header')).toHaveLength(1);
        const entityFields = document.getElementsByClassName('domain-no-wrap');
        expect(entityFields).toHaveLength(5);
        expect(document.querySelectorAll('input')).toHaveLength(4);
        expect(document.querySelectorAll('textarea')).toHaveLength(1);
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(2);
        expect(document.getElementsByClassName('alert')).toHaveLength(0);
    });

    test('custom properties', async () => {
        await act(async () => {
            renderWithAppContext(
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
        });

        expect(document.getElementsByClassName('domain-form-panel')).toHaveLength(1);
        expect(document.querySelector('.domain-panel-title').textContent).toBe('Source Properties');
        expect(document.getElementsByClassName('domain-field-float-right')).toHaveLength(1); // help link
        expect(document.querySelector('.entity-form--headerhelp').textContent).toBe('header text test');

        expect(document.getElementsByClassName('domain-panel-header')).toHaveLength(1);
        const entityFields = document.getElementsByClassName('domain-no-wrap');
        expect(entityFields).toHaveLength(3);
        expect(document.querySelectorAll('input')).toHaveLength(2);
        expect(document.querySelectorAll('textarea')).toHaveLength(1);
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(0);
        expect(document.getElementsByClassName('alert')).toHaveLength(0);
    });
});
