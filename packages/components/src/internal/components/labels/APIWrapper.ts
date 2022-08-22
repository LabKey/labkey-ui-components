import { fetchBarTenderConfiguration } from './actions';
import { BarTenderConfiguration } from './models';

export interface LabelPrintingAPIWrapper {
    fetchBarTenderConfiguration: () => Promise<BarTenderConfiguration>;
}

export class LabelPrintingServerAPIWrapper implements LabelPrintingAPIWrapper {
    fetchBarTenderConfiguration = fetchBarTenderConfiguration;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getLabelPrintingTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<LabelPrintingAPIWrapper> = {}
): LabelPrintingAPIWrapper {
    return {
        fetchBarTenderConfiguration: () => Promise.resolve(new BarTenderConfiguration()),
        ...overrides,
    };
}
