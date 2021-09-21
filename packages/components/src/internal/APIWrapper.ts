import { List } from 'immutable';
import { ISelectRowsResult } from './query/api';

import { getSampleSelectionLineageData } from './components/samples/actions';

export interface ComponentsAPIWrapper {
    getSampleSelectionLineageData: (
        selection: List<any>,
        sampleType: string,
        columns?: string[]
    ) => Promise<ISelectRowsResult>;
}

export class ServerAPIWrapper implements ComponentsAPIWrapper {
    getSampleSelectionLineageData = getSampleSelectionLineageData; // TODO see if this implementation should just move here
}

export const getDefaultAPIWrapper = (): ComponentsAPIWrapper => new ServerAPIWrapper();

export function getTestAPIWrapper(overrides: Partial<ComponentsAPIWrapper> = {}): ComponentsAPIWrapper {
    return {
        getSampleSelectionLineageData: jest.fn(),
        ...overrides,
    };
}
