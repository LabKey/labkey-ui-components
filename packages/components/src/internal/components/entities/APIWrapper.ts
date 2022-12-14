import { GetNameExpressionOptionsResponse, loadNameExpressionOptions } from '../settings/actions';

import { getDataOperationConfirmationData } from './actions';
import { DataOperation } from './constants';
import { OperationConfirmationData } from './models';

export interface EntityAPIWrapper {
    getDataOperationConfirmationData: (
        operation: DataOperation,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
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
