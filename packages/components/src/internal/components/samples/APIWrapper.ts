import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import {
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getSampleSelectionLineageData,
    getSampleStatuses,
    SampleAssayResultViewConfig,
} from './actions';
import { SampleState } from './models';
import { SampleOperation } from './constants';
import { getSampleOperationConfirmationData } from '../entities/actions';
import { OperationConfirmationData } from '../entities/models';

export interface SamplesAPIWrapper {
    getSampleAliquotRows: (sampleId: number | string) => Promise<Record<string, any>[]>;

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
        rowIds?: string[]) => Promise<OperationConfirmationData>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSampleSelectionLineageData = getSampleSelectionLineageData;
    getSampleStatuses = getSampleStatuses;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
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
        ...overrides,
    };
}
