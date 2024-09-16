import React from 'react';
import { render } from '@testing-library/react';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';
import getDatasetDesignSharedStudy from '../../../../test/data/dataset-getDatasetDesignSharedStudy.json';
import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import { AdvancedSettings, DatasetSettingsInput, DatasetSettingsSelect } from './DatasetPropertiesAdvancedSettings';
import { DatasetModel } from './models';

const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
const datasetModel = DatasetModel.create(null, getDatasetDesign);
const sharedDatasetModel = DatasetModel.create(null, getDatasetDesignSharedStudy);

describe('Dataset Advanced Settings', () => {
    test('New Dataset, without dataspace options', () => {
        const component = (
            <AdvancedSettings title="Advanced Settings" model={newDatasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('New Dataset, with dataspace options', () => {
        const component = (
            <AdvancedSettings title="Advanced Settings" model={newDatasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('Edit Dataset, without dataspace options', () => {
        const component = (
            <AdvancedSettings title="Advanced Settings" model={datasetModel} applyAdvancedProperties={jest.fn()} />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('Edit Dataset, with dataspace options', () => {
        const component = (
            <AdvancedSettings
                title="Advanced Settings"
                model={sharedDatasetModel}
                applyAdvancedProperties={jest.fn()}
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('DatasetSettingsInput', () => {
        render(
            <DatasetSettingsInput
                required={true}
                name="name"
                label="Name"
                value={name}
                helpTip="Help tip"
                placeholder="Enter a name for this dataset"
                disabled={false}
                onValueChange={jest.fn()}
                showInAdvancedSettings={false}
            />
        );

        expect(document.querySelector('.domain-no-wrap').textContent).toEqual('Name *');
        expect(document.querySelector('input').getAttribute('placeholder')).toEqual('Enter a name for this dataset');
    });

    test('DatasetSettingsSelect', () => {
        render(
            <DatasetSettingsSelect
                name="visitDateColumn"
                label="Visit Date Column"
                helpTip={<>Help tip</>}
                selectOptions={[{ label: 'A', value: 1 }]}
                selectedValue={1}
                onSelectChange={jest.fn()}
            />
        );

        expect(document.querySelectorAll('input')).toHaveLength(2);
        expect(document.querySelectorAll('input')[1].getAttribute('name')).toEqual('visitDateColumn');
    });
});
