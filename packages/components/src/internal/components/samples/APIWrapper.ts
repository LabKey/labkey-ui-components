/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ISelectRowsResult } from '../../query/api';

import { getSampleOperationConfirmationData } from '../entities/actions';

import { OperationConfirmationData } from '../entities/models';

import { TimelineEventModel } from '../auditlog/models';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { DomainDetails } from '../domainproperties/models';

import {
    createSessionAssayRunSummaryQuery,
    getColorSampleTypeExclusions,
    getDefaultDiscardStatus,
    getDistinctAssaysPerSample,
    getGroupedSampleDomainFields,
    getLookupRowIdsFromSelection,
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getSampleColors,
    getSampleCounter,
    getSampleStatuses,
    getSampleStorageId,
    getSampleTypeColorExclusions,
    getSampleTypeDetails,
    getSampleTypeLabelColor,
    getSampleTypeRowId,
    getSelectionLineageData,
    getTimelineEvents,
    hasExistingSamples,
    SampleAssayResultViewConfig,
    saveSampleCounter,
    updateColorSettings,
} from './actions';
import { GroupedSampleFields, SampleColorModel, SampleState } from './models';
import { SampleOperation } from './constants';
import { ExecuteSqlResponseWithSession } from '../../query/executeSql';
import { Row } from '../../query/selectRows';

export interface SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery: (sampleIds: number[]) => Promise<ExecuteSqlResponseWithSession>;

    getColorSampleTypeExclusions: (colorRowId: number, containerPath?: string) => Promise<number[]>;

    getDefaultDiscardStatus: (containerPath?: string) => Promise<number>;

    getDistinctAssaysPerSample: (sampleIds: number[]) => Promise<string[]>;

    getGroupedSampleDomainFields: (sampleType: string) => Promise<GroupedSampleFields>;

    getLookupRowIdsFromSelection: (
        schemaName: string,
        queryName: string,
        selected: any[],
        fieldKey: string,
        keyColumn?: string
    ) => Promise<number[]>;

    getSampleAliquotRows: (sampleId: number | string) => Promise<Row[]>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleColors: (includeArchive?: boolean, checkInUse?: boolean, containerPath?: string) => Promise<SampleColorModel[]>;

    getSampleCounter: (seqType: 'rootSampleCount' | 'sampleCount', containerPath?: string) => Promise<number>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        rowIds: number[] | string[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;

    getSampleStatuses: (includeInUse?: boolean, containerPath?: string) => Promise<SampleState[]>;

    getSampleStorageId: (sampleRowId: number) => Promise<number>;

    getSampleTypeColorExclusions: (
        sampleTypeRowId?: number,
        sampleTypeName?: string,
        containerPath?: string
    ) => Promise<number[]>;

    getSampleTypeDetails: (
        query?: SchemaQuery,
        domainId?: number,
        containerPath?: string,
        includeNamePreview?: boolean
    ) => Promise<DomainDetails>;

    getSampleTypeLabelColor: (name: string) => Promise<string>;

    getSampleTypeRowId: (name: string) => Promise<number>;

    getSelectionLineageData: (
        selection: Set<string>,
        schema: string,
        query: string,
        viewName: string,
        columns: string[] | undefined,
        sort: string | undefined
    ) => Promise<ISelectRowsResult>;

    getTimelineEvents: (
        sampleId: number,
        timezone?: string,
        inheritedFields?: string[]
    ) => Promise<TimelineEventModel[]>;

    hasExistingSamples: (isRoot?: boolean, containerPath?: string) => Promise<boolean>;

    saveSampleCounter: (
        newCount: number,
        seqType: 'rootSampleCount' | 'sampleCount',
        containerPath?: string
    ) => Promise<number>;

    updateColorSettings: (
        color: SampleColorModel,
        newlyDisabledTypeIds: number[],
        newlyEnabledTypeIds: number[],
        containerPath?: string
    ) => Promise<number>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    createSessionAssayRunSummaryQuery = createSessionAssayRunSummaryQuery;
    getGroupedSampleDomainFields = getGroupedSampleDomainFields;
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSelectionLineageData = getSelectionLineageData;
    getSampleColors = getSampleColors;
    getColorSampleTypeExclusions = getColorSampleTypeExclusions;
    getSampleTypeColorExclusions = getSampleTypeColorExclusions;
    updateColorSettings = updateColorSettings;
    getSampleStatuses = getSampleStatuses;
    getDefaultDiscardStatus = getDefaultDiscardStatus;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
    getSampleStorageId = getSampleStorageId;
    getSampleTypeLabelColor = getSampleTypeLabelColor;
    getSampleTypeRowId = getSampleTypeRowId;
    getLookupRowIdsFromSelection = getLookupRowIdsFromSelection;
    getTimelineEvents = getTimelineEvents;
    getSampleTypeDetails = getSampleTypeDetails;
    getDistinctAssaysPerSample = getDistinctAssaysPerSample;
    getSampleCounter = getSampleCounter;
    saveSampleCounter = saveSampleCounter;
    hasExistingSamples = hasExistingSamples;
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
        getSampleColors: mockFn(),
        getColorSampleTypeExclusions: mockFn(),
        getSampleTypeColorExclusions: mockFn(),
        updateColorSettings: mockFn(),
        getSampleStatuses: mockFn(),
        getDefaultDiscardStatus: mockFn(),
        getSampleOperationConfirmationData: mockFn(),
        getSampleStorageId: mockFn(),
        getSampleTypeLabelColor: mockFn(),
        getSampleTypeRowId: mockFn(),
        getLookupRowIdsFromSelection: mockFn(),
        getTimelineEvents: mockFn(),
        getSampleTypeDetails: mockFn(),
        getDistinctAssaysPerSample: mockFn(),
        getSampleCounter: mockFn(),
        saveSampleCounter: mockFn(),
        hasExistingSamples: mockFn(),
        ...overrides,
    };
}
