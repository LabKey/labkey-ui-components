import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { OperationConfirmationData } from '../entities/models';

import { FinderReport } from '../search/models';

import { loadFinderSearches } from '../search/actions';

import {
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getFieldLookupFromSelection,
    getSampleSelectionLineageData,
    getSampleStatuses,
    getSampleStorageId,
    SampleAssayResultViewConfig,
} from './actions';
import { SampleState } from './models';
import { SampleOperation } from './constants';

export interface SamplesAPIWrapper {
    getSampleAliquotRows: (sampleId: number | string) => Promise<Array<Record<string, any>>>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleSelectionLineageData: (
        selection: List<any>,
        sampleType: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getSampleStatuses: () => Promise<SampleState[]>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        selectionKey: string,
        rowIds?: number[] | string[]
    ) => Promise<OperationConfirmationData>;

    getSampleStorageId: (sampleRowId: number) => Promise<number>;

    getFieldLookupFromSelection: (
        schemaName: string,
        queryName: string,
        selected: any[],
        fieldKey: string
    ) => Promise<string[]>;

    loadFinderSearches: () => Promise<FinderReport[]>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSampleSelectionLineageData = getSampleSelectionLineageData;
    getSampleStatuses = getSampleStatuses;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
    getSampleStorageId = getSampleStorageId;
    getFieldLookupFromSelection = getFieldLookupFromSelection;
    loadFinderSearches = loadFinderSearches;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getSamplesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<SamplesAPIWrapper> = {}
): SamplesAPIWrapper {
    return {
        getSampleAliquotRows: mockFn(),
        getSampleAssayResultViewConfigs: mockFn(),
        getSampleSelectionLineageData: mockFn(),
        getSampleStatuses: mockFn(),
        getSampleOperationConfirmationData: mockFn(),
        getSampleStorageId: mockFn,
        getFieldLookupFromSelection: mockFn(),
        loadFinderSearches: mockFn,
        ...overrides,
    };
}
