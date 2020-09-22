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

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';
import getDatasetDesignSharedStudy from '../../../../test/data/dataset-getDatasetDesignSharedStudy.json';
import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';
import { SelectInput } from '../../../../index';

import { AdvancedSettings, DatasetSettingsInput, DatasetSettingsSelect } from './DatasetPropertiesAdvancedSettings';
import { DatasetModel } from './models';

const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
const datasetModel = DatasetModel.create(null, getDatasetDesign);
const sharedDatasetModel = DatasetModel.create(null, getDatasetDesignSharedStudy);

describe('Dataset Advanced Settings', () => {
    test('New Dataset, without dataspace options', () => {
        const datasetAdvancedSetting = (
            <AdvancedSettings title="Advanced Settings" model={newDatasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const dom = renderer.create(datasetAdvancedSetting).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('New Dataset, with dataspace options', () => {
        const datasetAdvancedSetting = (
            <AdvancedSettings title="Advanced Settings" model={newDatasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const dom = renderer.create(datasetAdvancedSetting).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('Edit Dataset, without dataspace options', () => {
        const datasetAdvancedSetting = (
            <AdvancedSettings title="Advanced Settings" model={datasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const dom = renderer.create(datasetAdvancedSetting).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('Edit Dataset, with dataspace options', () => {
        const datasetAdvancedSetting = (
            <AdvancedSettings
                title="Advanced Settings"
                model={sharedDatasetModel}
                applyAdvancedProperties={jest.fn()}
            />
        );

        const dom = renderer.create(datasetAdvancedSetting).toJSON();
        expect(dom).toMatchSnapshot();
    });

    test('DatasetSettingsInput', () => {
        const datasetSettingsInput = mount(
            <DatasetSettingsInput
                required={true}
                name="name"
                label="Name"
                value={name}
                helpTip={<>Help tip</>}
                placeholder="Enter a name for this dataset"
                disabled={false}
                onValueChange={jest.fn()}
                showInAdvancedSettings={false}
            />
        );

        expect(datasetSettingsInput.props().label).toEqual('Name');
        expect(datasetSettingsInput.props().placeholder).toEqual('Enter a name for this dataset');
        datasetSettingsInput.unmount();
    });

    test('DatasetSettingsSelect', () => {
        const datasetSettingsSelect = mount(
            <DatasetSettingsSelect
                name="visitDateColumn"
                label="Visit Date Column"
                helpTip={<>Help tip</>}
                selectOptions={[{ label: 'A', value: 1 }]}
                selectedValue={1}
                onSelectChange={jest.fn()}
            />
        );

        expect(datasetSettingsSelect.find(SelectInput)).toHaveProperty('name');
        datasetSettingsSelect.unmount();
    });
});
