/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

import renderer from 'react-test-renderer';

import { mount } from 'enzyme';

import { Radio } from 'react-bootstrap';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';

import { DomainPanelStatus } from '../models';

import { CollapsiblePanelHeader } from '../CollapsiblePanelHeader';

import { DatasetModel } from './models';

import { DatasetPropertiesPanel, DatasetPropertiesPanelImpl } from './DatasetPropertiesPanel';

import { BasicPropertiesFields } from './DatasetPropertiesPanelFormElements';

describe('Dataset Properties Panel', () => {
    const BASE_PROPS = {
        panelStatus: 'NONE' as DomainPanelStatus,
        validate: false,
        controlledCollapse: false,
        initCollapsed: false,
        collapsed: false,
    };

    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test('New dataset', () => {
        const propertiesPanel = (
            <DatasetPropertiesPanel
                initCollapsed={false}
                model={newDatasetModel}
                controlledCollapse={true}
                panelStatus="COMPLETE"
                validate={false}
                onToggle={(collapsed, callback) => {}}
                onChange={jest.fn()}
            />
        );

        const dom = renderer.create(propertiesPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('Edit existing dataset', () => {
        const propertiesPanel = (
            <DatasetPropertiesPanel
                initCollapsed={false}
                model={populatedDatasetModel}
                controlledCollapse={true}
                panelStatus="COMPLETE"
                validate={false}
                onToggle={jest.fn()}
                onChange={jest.fn()}
            />
        );

        const dom = renderer.create(propertiesPanel).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('set state for isValid', () => {
        const propertiesPanel = mount(
            <DatasetPropertiesPanelImpl
                {...BASE_PROPS}
                model={populatedDatasetModel}
                togglePanel={jest.fn()}
                onChange={jest.fn()}
            />
        );

        expect(propertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(propertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(propertiesPanel.find(Radio)).toHaveLength(3);

        expect(propertiesPanel.state()).toHaveProperty('isValid', true);
        propertiesPanel.setState({ isValid: false });
        expect(propertiesPanel.state()).toHaveProperty('isValid', false);

        expect(propertiesPanel.find(CollapsiblePanelHeader)).toHaveLength(1);
        expect(propertiesPanel.find(BasicPropertiesFields)).toHaveLength(1);
        expect(propertiesPanel.find(Radio)).toHaveLength(3);

        propertiesPanel.unmount();
    });
});
