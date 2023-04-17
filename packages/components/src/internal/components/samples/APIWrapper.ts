import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { OperationConfirmationData } from '../entities/models';

import { FinderReport } from '../search/models';

import { loadFinderSearches } from '../search/actions';

import { TimelineEventModel } from '../auditlog/models';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { DomainDetails } from '../domainproperties/models';

import {
    getGroupedSampleDomainFields,
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getFieldLookupFromSelection,
    getSelectionLineageData,
    getSampleStatuses,
    getSampleStorageId,
    getTimelineEvents,
    getSampleTypeDetails,
    SampleAssayResultViewConfig,
    createSessionAssayRunSummaryQuery,
    getDistinctAssaysPerSample,
} from './actions';
import { GroupedSampleFields, SampleState } from './models';
import { SampleOperation } from './constants';

export interface SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery: (sampleIds: number[]) => Promise<ISelectRowsResult>;

    getDistinctAssaysPerSample: (sampleIds: number[]) => Promise<string[]>;

    getFieldLookupFromSelection: (
        schemaName: string,
        queryName: string,
        selected: any[],
        fieldKey: string
    ) => Promise<string[]>;

    getGroupedSampleDomainFields: (sampleType: string) => Promise<GroupedSampleFields>;

    getSampleAliquotRows: (sampleId: number | string) => Promise<Array<Record<string, any>>>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        rowIds: number[] | string[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;

    getSampleStatuses: (includeInUse?: boolean) => Promise<SampleState[]>;

    getSampleStorageId: (sampleRowId: number) => Promise<number>;

    getSampleTypeDetails: (
        query?: SchemaQuery,
        domainId?: number,
        containerPath?: string,
        includeNamePreview?: boolean
    ) => Promise<DomainDetails>;

    getSelectionLineageData: (
        selection: List<any>,
        schema: string,
        query: string,
        viewName: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getTimelineEvents: (sampleId: number, timezone?: string) => Promise<TimelineEventModel[]>;

    loadFinderSearches: (excludeModuleReport?: boolean) => Promise<FinderReport[]>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery = createSessionAssayRunSummaryQuery;
    getGroupedSampleDomainFields = getGroupedSampleDomainFields;
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
    getDistinctAssaysPerSample = getDistinctAssaysPerSample;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getSamplesTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<SamplesAPIWrapper> = {}
): SamplesAPIWrapper {
    return {
        createSessionAssayRunSummaryQuery: mockFn(),
        getGroupedSampleDomainFields: mockFn(),
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
        getDistinctAssaysPerSample: mockFn(),
        ...overrides,
    };
}
