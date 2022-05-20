
import {
    getDataOperationConfirmationData,
} from './actions';
import {DataOperation} from "./constants";
import {OperationConfirmationData} from "./models";

export interface EntityAPIWrapper {
    getDataOperationConfirmationData(
        operation: DataOperation,
        selectionKey: string,
        rowIds?: string[] | number[]
    ): Promise<OperationConfirmationData>;
}

export class EntityServerAPIWrapper implements EntityAPIWrapper {
    getDataOperationConfirmationData = getDataOperationConfirmationData;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getEntityTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<EntityAPIWrapper> = {}
): EntityAPIWrapper {
    return {
        getDataOperationConfirmationData: mockFn(),
        ...overrides,
    };
}
