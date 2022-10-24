import { getDataOperationConfirmationData } from './actions';
import { DataOperation } from './constants';
import { OperationConfirmationData } from './models';
import { GetNameExpressionOptionsResponse, loadNameExpressionOptions } from '../settings/actions';

export interface EntityAPIWrapper {
    getDataOperationConfirmationData: (
        operation: DataOperation,
        selectionKey: string,
        rowIds?: string[] | number[]
    ) => Promise<OperationConfirmationData>;

    loadNameExpressionOptions: (containerPath?: string) => Promise<GetNameExpressionOptionsResponse>;
}

export class EntityServerAPIWrapper implements EntityAPIWrapper {
    getDataOperationConfirmationData = getDataOperationConfirmationData;
    loadNameExpressionOptions = loadNameExpressionOptions;
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
        loadNameExpressionOptions: mockFn(),
        ...overrides,
    };
}
