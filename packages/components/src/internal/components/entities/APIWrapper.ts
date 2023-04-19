import { List, Map } from 'immutable';

import { GetNameExpressionOptionsResponse, loadNameExpressionOptions } from '../settings/actions';

import { QueryInfo } from '../../../public/QueryInfo';

import { InsertOptions } from '../../query/api';

import {
    getDataOperationConfirmationData,
    getEntityTypeData,
    getOriginalParentsFromLineage,
    handleEntityFileImport,
    moveSamples,
} from './actions';
import { DataOperation } from './constants';
import {
    EntityChoice,
    EntityDataType,
    EntityIdCreationModel,
    IEntityTypeOption,
    MoveSamplesResult,
    OperationConfirmationData,
} from './models';

export interface EntityAPIWrapper {
    getDataOperationConfirmationData: (
        operation: DataOperation,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;
    getEntityTypeData: (
        model: EntityIdCreationModel,
        entityDataType: EntityDataType,
        parentSchemaQueries: Map<string, EntityDataType>,
        targetQueryName: string,
        allowParents: boolean,
        isItemSamples: boolean,
        combineParentTypes: boolean
    ) => Promise<Partial<EntityIdCreationModel>>;
    getOriginalParentsFromLineage: (
        lineage: Record<string, any>,
        parentDataTypes: EntityDataType[],
        containerPath?: string
    ) => Promise<{
        originalParents: Record<string, List<EntityChoice>>;
        parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    }>;
    handleEntityFileImport: (
        importAction: string,
        queryInfo: QueryInfo,
        file: File,
        insertOption: InsertOptions,
        useAsync: boolean,
        importParameters?: Record<string, any>,
        importFileController?: string,
        saveToPipeline?: boolean
    ) => Promise<any>;
    loadNameExpressionOptions: (containerPath?: string) => Promise<GetNameExpressionOptionsResponse>;
    moveSamples: (
        targetContainer: string,
        rowIds: number[],
        selectionKey: string,
        useSnapshotSelection: boolean,
        auditUserComment: string
    ) => Promise<MoveSamplesResult>;
}

export class EntityServerAPIWrapper implements EntityAPIWrapper {
    getDataOperationConfirmationData = getDataOperationConfirmationData;
    getEntityTypeData = getEntityTypeData;
    getOriginalParentsFromLineage = getOriginalParentsFromLineage;
    handleEntityFileImport = handleEntityFileImport;
    loadNameExpressionOptions = loadNameExpressionOptions;
    moveSamples = moveSamples;
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
        getEntityTypeData: mockFn(),
        getOriginalParentsFromLineage: mockFn(),
        handleEntityFileImport: mockFn(),
        loadNameExpressionOptions: mockFn(),
        moveSamples: mockFn(),
        ...overrides,
    };
}
