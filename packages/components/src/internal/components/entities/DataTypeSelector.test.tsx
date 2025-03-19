import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AppContextTestProviderProps } from '../../test/testHelpers';

import { AssayRunDataType, DataClassDataType, SampleTypeDataType } from './constants';
import {
    DataTypeSelector,
    DataTypeSelectorProps,
    getUncheckedEntityWarning,
    filterDataTypeHiddenEntity,
} from './DataTypeSelector';
import { DataTypeEntity } from './models';

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
        render(warning);
        expect(document.querySelector('.fa-spinner')).toBeInTheDocument();
    });

    test('dataCounts empty', () => {
        const warning = getUncheckedEntityWarning([1, 2], [1], {}, SampleTypeDataType, 2);
        expect(warning).toBeNull();
    });

    test('dataCounts not empty', () => {
        let warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, SampleTypeDataType, 1);
        expect(JSON.stringify(warning)).toContain(
            '1," ","sample"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, AssayRunDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","runs"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, DataClassDataType, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","sources"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );

        warning = getUncheckedEntityWarning([1, 2], [], { '1': 1, '2': 2 }, null, 2);
        expect(JSON.stringify(warning)).toContain(
            '2," ","samples"," will no longer be visible in this folder. They won\'t be deleted and lineage relationships won\'t change.'
        );
    });
});

describe('filterDataTypeHiddenEntity', () => {
    test('no hiddenEntities', () => {
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, undefined)).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, [])).toBe(true);
    });

    test('hiddenEntities', () => {
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, [1])).toBe(false);
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, [2])).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, [2, 3])).toBe(true);
        expect(filterDataTypeHiddenEntity({ rowId: 1 } as DataTypeEntity, [1, 2])).toBe(false);
    });

    test('by lsid', () => {
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' } as DataTypeEntity, [1])).toBe(true);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' } as DataTypeEntity, ['test'])).toBe(true);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' } as DataTypeEntity, ['test1'])).toBe(false);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' } as DataTypeEntity, ['test1', 'test2'])).toBe(false);
        expect(filterDataTypeHiddenEntity({ lsid: 'test1' } as DataTypeEntity, ['test0', 'test2'])).toBe(true);
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
    const inactiveSampleTypes = [
        {
            label: 'PBMC',
            labelColor: '#2980b9',
            rowId: 25,
            description: null,
            type: 'SampleType',
            lsid: 'urn:lsid:labkey.com:SampleSet.Folder-105:3',
            inactive: true,
        },
    ];
    const apiWithResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(sampleTypes),
        }),
    });
    const apiWithInactiveResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest
                .fn()
                .mockResolvedValue([...sampleTypes, ...inactiveSampleTypes]),
        }),
    });
    const apiWithOnlyInactiveResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(inactiveSampleTypes),
        }),
    });
    const apiWithNoResults = getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue([]),
        }),
    });

    function defaultContext(api = apiWithNoResults): AppContextTestProviderProps {
        return {
            appContext: { api },
        };
    }

    function defaultProps(): DataTypeSelectorProps {
        return {
            entityDataType: SampleTypeDataType,
            uncheckedEntitiesDB: [],
            updateUncheckedTypes: jest.fn(),
        };
    }

    function waitForLoaded(): Promise<void> {
        return waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    }

    test('data types blank', async () => {
        renderWithAppContext(<DataTypeSelector {...defaultProps()} />, defaultContext());

        await waitForLoaded();
        expect(document.querySelector('.content-group-label')).toHaveTextContent('Sample Types');
        expect(document.querySelector('.help-block')).toHaveTextContent('No sample types');
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(0);
    });

    test('with data types', async () => {
        renderWithAppContext(<DataTypeSelector {...defaultProps()} />, defaultContext(apiWithResults));

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2); // outer col + 1 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
        expect(document.querySelector('.container-expandable')).not.toBeInTheDocument();
    });

    test('with inactive data types', async () => {
        renderWithAppContext(<DataTypeSelector {...defaultProps()} />, defaultContext(apiWithInactiveResults));

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2); // outer col + 1 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);

        expect(document.querySelector('.container-expandable')).toBeInTheDocument();
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(3);
        expect(document.querySelectorAll('.folder-faceted-data-type')[2]).toHaveTextContent('PBMC');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[2]).toBeChecked();
        await userEvent.click(document.querySelector('.container-expandable-child__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
    });

    test('with only inactive data types', async () => {
        renderWithAppContext(<DataTypeSelector {...defaultProps()} />, defaultContext(apiWithOnlyInactiveResults));

        await waitForLoaded();
        expect(document.querySelector('.content-group-label')).toHaveTextContent('Sample Types');
        expect(document.querySelector('.help-block')).toHaveTextContent('No sample types');
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(0);

        expect(document.querySelector('.container-expandable')).toBeInTheDocument();
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(1);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('PBMC');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
    });

    test('with 2 columns', async () => {
        renderWithAppContext(<DataTypeSelector {...defaultProps()} columns={2} />, defaultContext(apiWithResults));

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(3); // outer col + 2 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(2);
    });

    test('with 2 columns and with inactive data types', async () => {
        renderWithAppContext(
            <DataTypeSelector {...defaultProps()} columns={2} />,
            defaultContext(apiWithInactiveResults)
        );

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(3); // outer col + 2 inner col
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(2);

        const archivedSectionHeader = document.querySelectorAll('.container-expandable');
        expect(archivedSectionHeader.length).toBe(1);
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(3);
        expect(document.querySelectorAll('.folder-faceted-data-type')[2]).toHaveTextContent('PBMC');
    });

    test('toggleSelectAll = false', async () => {
        renderWithAppContext(
            <DataTypeSelector {...defaultProps()} toggleSelectAll={false} />,
            defaultContext(apiWithResults)
        );

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(1);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });

    test('with uncheckedEntitiesDB', async () => {
        renderWithAppContext(
            <DataTypeSelector {...defaultProps()} uncheckedEntitiesDB={[56]} />,
            defaultContext(apiWithResults)
        );

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('Blood');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).not.toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('DNA');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });

    test('when allDataCounts and allDataTypes are provided', async () => {
        const allDataTypes: DataTypeEntity[] = [
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

        renderWithAppContext(
            <DataTypeSelector
                {...defaultProps()}
                allDataTypes={allDataTypes}
                allDataCounts={allDataCounts}
                dataTypeLabel="storage"
            />,
            defaultContext()
        );

        await waitForLoaded();
        expect(document.querySelectorAll('.folder-faceted-data-type')).toHaveLength(2);
        expect(document.querySelectorAll('.folder-faceted-data-type')[0]).toHaveTextContent('freezer1Floor1/Room2');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[0]).toBeChecked();
        expect(document.querySelectorAll('.folder-faceted-data-type')[1]).toHaveTextContent('freezer2');
        expect(document.querySelectorAll('.filter-faceted__checkbox')[1]).toBeChecked();
        expect(document.querySelectorAll('.col-xs-12')).toHaveLength(2);
        expect(document.querySelectorAll('.col-md-6')).toHaveLength(0);
    });
});
