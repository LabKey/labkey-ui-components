import { SamplesAPIWrapper, SamplesServerAPIWrapper, getSamplesTestAPIWrapper } from './components/samples/APIWrapper';

export interface ComponentsAPIWrapper {
    // TODO add more wrappers for other functional areas of this package
    samples: SamplesAPIWrapper;
}

export function getDefaultAPIWrapper(): ComponentsAPIWrapper {
    return {
        samples: new SamplesServerAPIWrapper(),
    };
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getTestAPIWrapper(mockFn = (): any => () => {}, overrides: Partial<ComponentsAPIWrapper> = {}): ComponentsAPIWrapper {
    return {
        samples: getSamplesTestAPIWrapper(mockFn, overrides.samples),
        ...overrides,
    };
}
