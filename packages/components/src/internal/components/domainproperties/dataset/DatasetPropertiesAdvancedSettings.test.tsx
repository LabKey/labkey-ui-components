import React from 'react';
import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { List } from 'immutable';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import { QueryInfo } from '../../../../public/QueryInfo';

import { AdvancedSettings, DatasetSettingsInput, DatasetSettingsSelect } from './DatasetPropertiesAdvancedSettings';
import { DatasetModel } from './models';

jest.mock('../../../query/api', () => ({
    ...jest.requireActual('../../../query/api'),
    selectRowsDeprecated: () =>
        Promise.resolve({
            key: 'test',
            models: { test: {} },
            orderedModels: { test: List() },
            queries: { test: QueryInfo.fromJsonForTests({}) },
            rowCount: 0,
        }),
}));

const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);

describe('Dataset Advanced Settings', () => {
    test('button render', async () => {
        render(
            <AdvancedSettings title="Advanced Settings" model={newDatasetModel} applyAdvancedProperties={jest.fn()} />
        );

        await waitFor(() => {
            expect(document.querySelectorAll('button').length).toBe(1);
            expect(document.querySelector('button').textContent).toBe('Advanced Settings');
        });
    });

    test('DatasetSettingsInput', async () => {
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

        await waitFor(() => {
            expect(document.querySelector('.domain-no-wrap').textContent).toEqual('Name *');
            expect(document.querySelector('input').getAttribute('placeholder')).toEqual(
                'Enter a name for this dataset'
            );
        });
    });

    test('DatasetSettingsSelect', async () => {
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

        await waitFor(() => {
            expect(document.querySelectorAll('input')).toHaveLength(2);
            expect(document.querySelectorAll('input')[1].getAttribute('name')).toEqual('visitDateColumn');
        });
    });
});
