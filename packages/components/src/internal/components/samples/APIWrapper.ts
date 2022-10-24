import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { OperationConfirmationData } from '../entities/models';

import { FinderReport } from '../search/models';

import { loadFinderSearches } from '../search/actions';

import { TimelineEventModel } from '../auditlog/models';

import {
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getFieldLookupFromSelection,
    getSelectionLineageData,
    getSampleStatuses,
    getSampleStorageId,
    getTimelineEvents,
    getSampleTypeDetails,
    SampleAssayResultViewConfig,
} from './actions';
import { SampleState } from './models';
import { SampleOperation } from './constants';
import {SchemaQuery} from "../../../public/SchemaQuery";
import {DomainDetails} from "../domainproperties/models";

export interface SamplesAPIWrapper {
    getFieldLookupFromSelection: (
        schemaName: string,
        queryName: string,
        selected: any[],
        fieldKey: string
    ) => Promise<string[]>;

    getSampleAliquotRows: (sampleId: number | string) => Promise<Array<Record<string, any>>>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        selectionKey: string,
        rowIds?: number[] | string[]
    ) => Promise<OperationConfirmationData>;

    getSampleStatuses: () => Promise<SampleState[]>;

    getSampleStorageId: (sampleRowId: number) => Promise<number>;

    getSelectionLineageData: (
        selection: List<any>,
        schema: string,
        query: string,
        viewName: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getTimelineEvents: (sampleId: number, timezone?: string) => Promise<TimelineEventModel[]>;

    loadFinderSearches: () => Promise<FinderReport[]>;

    getSampleTypeDetails: (
        query?: SchemaQuery,
        domainId?: number,
        containerPath?: string,
        includeNamePreview?: boolean
    ) => Promise<DomainDetails>;
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
    getSampleTypeDetails = getSampleTypeDetails;
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
        getTimelineEvents: mockFn(),
        getSampleTypeDetails: mockFn(),
        ...overrides,
    };
}
