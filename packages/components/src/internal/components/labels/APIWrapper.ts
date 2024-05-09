import { updateCustomLabels, getModuleCustomLabels } from './actions';

export interface LabelsAPIWrapper {
    getModuleCustomLabels: (moduleName: string, containerPath?: string) => Promise<Record<string, string>>;
    updateCustomLabels: (
        labelProvider: string,
        labels: Record<string, string>,
        containerPath?: string
    ) => Promise<void>;
}

export class ServerLabelsAPIWrapper implements LabelsAPIWrapper {
    updateCustomLabels = updateCustomLabels;
    getModuleCustomLabels = getModuleCustomLabels;
}

export function getLabelsTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<LabelsAPIWrapper> = {}
): LabelsAPIWrapper {
    return {
        updateCustomLabels: mockFn(),
        getModuleCustomLabels: mockFn(),
        ...overrides,
    };
}
