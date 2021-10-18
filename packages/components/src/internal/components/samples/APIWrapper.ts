import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import {
    getSampleAliquotRows,
    getSampleAssayResultViewConfigs,
    getSampleSelectionLineageData,
    getSampleStatuses,
    SampleAssayResultViewConfig,
    SampleState,
} from './actions';

export interface SamplesAPIWrapper {
    getSampleAliquotRows: (sampleId: number | string) => Promise<Record<string, any>[]>;

    getSampleAssayResultViewConfigs: () => Promise<SampleAssayResultViewConfig[]>;

    getSampleSelectionLineageData: (
        selection: List<any>,
        sampleType: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;

    getSampleStatuses: () => Promise<SampleState[]>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleAliquotRows = getSampleAliquotRows;
    getSampleAssayResultViewConfigs = getSampleAssayResultViewConfigs;
    getSampleSelectionLineageData = getSampleSelectionLineageData;
    getSampleStatuses = getSampleStatuses;
}

export function getSamplesTestAPIWrapper(overrides: Partial<SamplesAPIWrapper> = {}): SamplesAPIWrapper {
    return {
        getSampleAliquotRows: jest.fn(),
        getSampleAssayResultViewConfigs: jest.fn(),
        getSampleSelectionLineageData: jest.fn(),
        getSampleStatuses: jest.fn(),
        ...overrides,
    };
}
