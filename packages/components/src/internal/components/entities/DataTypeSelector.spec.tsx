import React from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';

import { AssayRunDataType, DataClassDataType, SampleTypeDataType } from './constants';
import { DataTypeSelector, getUncheckedEntityWarning } from './DataTypeSelector';

describe('getUncheckedEntityWarning', () => {
    test('rowId in uncheckedEntitiesDB', () => {
        let warning = getUncheckedEntityWarning([1, 2], [1], null, SampleTypeDataType, 1);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 1);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], { '1': 2 }, SampleTypeDataType, 1);
        expect(warning).toBeNull();
    });

    test('rowId not in uncheckedEntities', () => {
        let warning = getUncheckedEntityWarning([1], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1], [1], { '1': 1, '2': 2 }, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1], [1], null, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('rowId not in uncheckedEntitiesDB', () => {
        let warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();

        warning = getUncheckedEntityWarning([1, 2], [1], { '1': 2 }, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('dataCounts null', () => {
        const warning = getUncheckedEntityWarning([1, 2], [1], null, SampleTypeDataType, 2);
        expect(warning).toEqual(<LoadingSpinner />);
    });

    test('dataCounts empty', () => {
        const warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('dataCounts not empty', () => {
        let warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this project. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 1);
        expect(JSON.stringify(warning)).toContain(
            '1," ","sample"," will no longer be visible in this project. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, AssayRunDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","runs"," will no longer be visible in this project. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, DataClassDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","sources"," will no longer be visible in this project. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, null, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this project. They won\'t be deleted and lineage relationships won\'t change.'
        );
    });
});

describe('DataTypeSelector', () => {
    const sampleTypes = [
        {
            label: 'Blood',
            labelColor: '#2980b9',
            rowId: 56,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-107:9',
        },
        {
            label: 'DNA',
            labelColor: '#6E1A1A',
            rowId: 111,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-107:11',
        },
    ];
    const apiWithResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getProjectConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(sampleTypes),
        }),
    });
    const apiWithNoResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getProjectConfigurableEntityTypeOptions: jest.fn().mockResolvedValue([]),
        }),
    });

    test('loading', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithNoResults} />
        );

        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
    });

    test('data types blank', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithNoResults} />
        );

        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(0);
        expect(wrapper.text()).toEqual('Sample TypesNo sample types');
    });

    test('with data types', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithResults} />
        );

        await waitForLifecycle(wrapper);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(2);
        expect(wrapper.text()).toEqual('Sample TypesDeselect AllBloodDNA');

        expect(wrapper.find('.col-xs-12')).toHaveLength(2); // outer col + 1 inner col
        expect(wrapper.find('.col-md-6')).toHaveLength(0);

        const checkboxes = wrapper.find('.filter-faceted__checkbox');
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).prop('checked')).toBeTruthy();
        expect(checkboxes.at(1).prop('checked')).toBeTruthy();
    });

    test('with 2 columns', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithResults} columns={2} />
        );

        await waitForLifecycle(wrapper);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(2);
        expect(wrapper.find('.col-xs-12')).toHaveLength(3); // outer col + 2 inner col
        expect(wrapper.find('.col-md-6')).toHaveLength(2);
    });

    test('toggleSelectAll = false', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithResults} toggleSelectAll={false} />
        );

        await waitForLifecycle(wrapper);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(2);
        expect(wrapper.text()).toEqual('Sample TypesBloodDNA');
    });

    test('with uncheckedEntitiesDB', async () => {
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector entityDataType={SampleTypeDataType} api={apiWithResults} uncheckedEntitiesDB={[56]} />
        );

        await waitForLifecycle(wrapper);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(2);
        expect(wrapper.text()).toEqual('Sample TypesSelect AllBloodDNA');

        const checkboxes = wrapper.find('.filter-faceted__checkbox');
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).prop('checked')).toBeFalsy();
        expect(checkboxes.at(1).prop('checked')).toBeTruthy();
    });

    test('when allDataCounts and allDataTypes are provided', () => {
        const allDataTypes = [
            {
                label: 'freezer1',
                rowId: 12035,
                sublabel: 'Floor1/Room2',
                description: 'This is freezer 1',
                type: 'StorageLocation',
            },
            {
                label: 'freezer2',
                rowId: 12047,
                sublabel: null,
                description: 'This is freezer 2',
                type: 'StorageLocation',
            },
        ];
        const allDataCounts = {
            '12035': 7,
            '12047': 0,
        };
        const wrapper = mountWithAppServerContext(
            <DataTypeSelector allDataTypes={allDataTypes} allDataCounts={allDataCounts} dataTypeLabel="storage" />
        );

        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        const list = wrapper.find('li.project-faceted__li');
        expect(list).toHaveLength(2);
        expect(wrapper.text()).toEqual('storageDeselect Allfreezer1Floor1/Room2freezer2');
    });
});
