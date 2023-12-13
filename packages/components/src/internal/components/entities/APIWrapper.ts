import { List, Map } from 'immutable';

import { GetNameExpressionOptionsResponse, loadNameExpressionOptions } from '../settings/actions';

import { QueryInfo } from '../../../public/QueryInfo';

import { InsertOptions } from '../../query/api';

import { Container } from '../base/models/Container';

import {
    getDataOperationConfirmationData,
    getDeleteConfirmationData,
    getMoveConfirmationData,
    getEntityTypeData,
    getOriginalParentsFromLineage,
    handleEntityFileImport,
    moveEntities,
    initParentOptionsSelects,
} from './actions';
import { DataOperation } from './constants';
import {
    EntityChoice,
    EntityDataType,
    EntityIdCreationModel,
    IEntityTypeOption,
    IParentAlias,
    IParentOption,
    MoveEntitiesResult,
    OperationConfirmationData,
} from './models';

export interface EntityAPIWrapper {
    getDataOperationConfirmationData: (
        operation: DataOperation,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;
    getDeleteConfirmationData: (
        dataType: EntityDataType,
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
    getMoveConfirmationData: (
        dataType: EntityDataType,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;
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
    initParentOptionsSelects: (
        includeSampleTypes: boolean,
        includeDataClasses: boolean,
        containerPath: string,
        isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean,
        newTypeOption?: any,
        importAliases?: Map<string, string>,
        idPrefix?: string,
        formatLabel?: (name: string, prefix: string, isDataClass?: boolean, containerPath?: string) => string
    ) => Promise<{
        parentAliases: Map<string, IParentAlias>;
        parentOptions: IParentOption[];
    }>;
    loadNameExpressionOptions: (containerPath?: string) => Promise<GetNameExpressionOptionsResponse>;
    moveEntities: (
        sourceContainer: Container,
        targetContainer: string,
        entityDataType: EntityDataType,
        queryName: string,
        rowIds?: number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean,
        auditUserComment?: string
    ) => Promise<MoveEntitiesResult>;
}

export class EntityServerAPIWrapper implements EntityAPIWrapper {
    getDataOperationConfirmationData = getDataOperationConfirmationData;
    getDeleteConfirmationData = getDeleteConfirmationData;
    getMoveConfirmationData = getMoveConfirmationData;
    getEntityTypeData = getEntityTypeData;
    getOriginalParentsFromLineage = getOriginalParentsFromLineage;
    handleEntityFileImport = handleEntityFileImport;
    loadNameExpressionOptions = loadNameExpressionOptions;
    moveEntities = moveEntities;
    initParentOptionsSelects = initParentOptionsSelects;
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
        getDeleteConfirmationData: mockFn(),
        getMoveConfirmationData: mockFn(),
        getEntityTypeData: mockFn(),
        getOriginalParentsFromLineage: mockFn(),
        handleEntityFileImport: mockFn(),
        loadNameExpressionOptions: mockFn(),
        moveEntities: mockFn(),
        initParentOptionsSelects: mockFn(),
        ...overrides,
    };
}
