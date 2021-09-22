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

export function getTestAPIWrapper(overrides: Partial<ComponentsAPIWrapper> = {}): ComponentsAPIWrapper {
    return {
        samples: getSamplesTestAPIWrapper(overrides.samples),
        ...overrides,
    };
}
