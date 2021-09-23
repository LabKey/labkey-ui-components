import { List } from 'immutable';

import { ISelectRowsResult } from '../../query/api';

import { getSampleSelectionLineageData } from './actions';

export interface SamplesAPIWrapper {
    getSampleSelectionLineageData: (
        selection: List<any>,
        sampleType: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;
}

export class SamplesServerAPIWrapper implements SamplesAPIWrapper {
    getSampleSelectionLineageData = getSampleSelectionLineageData;
}

export function getSamplesTestAPIWrapper(overrides: Partial<SamplesAPIWrapper> = {}): SamplesAPIWrapper {
    return {
        getSampleSelectionLineageData: jest.fn(),
        ...overrides,
    };
}
