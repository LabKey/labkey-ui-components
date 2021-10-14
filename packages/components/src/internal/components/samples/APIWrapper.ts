import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import {
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getSampleSelectionLineageData,
    SampleAssayResultViewConfig,
} from './actions';
import { SampleOperation } from './constants';
import { getSampleOperationConfirmationData, OperationConfirmationData } from '../entities/actions';

export interface SamplesAPIWrapper {
    getSampleAliquotRows: (sampleId: number | string) => Promise<Record<string, any>[]>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleSelectionLineageData: (
        selection: List<any>,
        sampleType: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getSampleOperationConfirmationData: (
        operation: SampleOperation,
        selectionKey: string,
        rowIds?: string[]) => Promise<OperationConfirmationData>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSampleSelectionLineageData = getSampleSelectionLineageData;
    getSampleOperationConfirmationData = getSampleOperationConfirmationData;
}

export function getSamplesTestAPIWrapper(overrides: Partial<SamplesAPIWrapper> = {}): SamplesAPIWrapper {
    return {
        getSampleAliquotRows: jest.fn(),
        getSampleAssayResultViewConfigs: jest.fn(),
        getSampleSelectionLineageData: jest.fn(),
        getSampleOperationConfirmationData: jest.fn(),
        ...overrides,
    };
}
