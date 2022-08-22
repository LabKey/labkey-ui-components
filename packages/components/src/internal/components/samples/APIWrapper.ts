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
    getSelectionLineageData,
    getSampleStatuses,
    getSampleStorageId,
    getTimelineEvents,
    SampleAssayResultViewConfig,
} from './actions';
import { SampleState } from './models';
import { SampleOperation } from './constants';
import { TimelineEventModel } from "../auditlog/models";

export interface SamplesAPIWrapper {
    getSampleAliquotRows: (sampleId: number | string) => Promise<Array<Record<string, any>>>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSelectionLineageData: (
        selection: List<any>,
        schema: string,
        query: string,
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

    getTimelineEvents: (sampleId : number, timezone?: string) => Promise<TimelineEventModel[]>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSelectionLineageData = getSelectionLineageData;
    getSampleStatuses = getSampleStatuses;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
    getSampleStorageId = getSampleStorageId;
    getFieldLookupFromSelection = getFieldLookupFromSelection;
    loadFinderSearches = loadFinderSearches;
    getTimelineEvents = getTimelineEvents;
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
        getSelectionLineageData: mockFn(),
        getSampleStatuses: mockFn(),
        getSampleOperationConfirmationData: mockFn(),
        getSampleStorageId: mockFn(),
        getFieldLookupFromSelection: mockFn(),
        loadFinderSearches: mockFn(),
        getTimelineEvents: mockFn,
        ...overrides,
    };
}
