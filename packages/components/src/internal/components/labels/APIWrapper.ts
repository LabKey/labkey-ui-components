import { updateProjectCustomLabels, getCustomLabels } from './actions';

export interface LabelsAPIWrapper {
    getCustomLabels: (moduleName: string, containerPath?: string) => Promise<Record<string, string>>;
    updateProjectCustomLabels: (
        labelProvider: string,
        labels: Record<string, string>,
        containerPath?: string
    ) => Promise<void>;
}

export class ServerLabelsAPIWrapper implements LabelsAPIWrapper {
    updateProjectCustomLabels = updateProjectCustomLabels;
    getCustomLabels = getCustomLabels;
}

export function getLabelsTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<LabelsAPIWrapper> = {}
): LabelsAPIWrapper {
    return {
        updateProjectCustomLabels: mockFn(),
        getCustomLabels: mockFn(),
        ...overrides,
    };
}
