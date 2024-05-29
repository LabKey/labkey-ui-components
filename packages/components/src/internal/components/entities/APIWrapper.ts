import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import { GetNameExpressionOptionsResponse, loadNameExpressionOptions } from '../settings/actions';

import { QueryInfo } from '../../../public/QueryInfo';

import { InsertOptions } from '../../query/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import {
    getDataOperationConfirmationData,
    GetDeleteConfirmationDataOptions,
    getDeleteConfirmationData,
    getMoveConfirmationData,
    getOperationConfirmationData,
    getOperationConfirmationDataForModel,
    getEntityTypeData,
    getOriginalParentsFromLineage,
    getParentTypeDataForLineage,
    handleEntityFileImport,
    moveEntities,
    initParentOptionsSelects,
    MoveEntitiesOptions,
    getCrossFolderSelectionResult,
    GetParentTypeDataForLineage,
    isDataTypeEmpty,
} from './actions';
import { DataOperation } from './constants';
import {
    CrossFolderSelectionResult,
    EntityChoice,
    EntityDataType,
    EntityIdCreationModel,
    IEntityTypeOption,
    IParentAlias,
    IParentOption,
    OperationConfirmationData, ProjectConfigurableDataType,
} from './models';

export interface EntityAPIWrapper {
    getCrossFolderSelectionResult: (
        dataRegionSelectionKey: string,
        dataType: string, // 'samples' | 'exp.data' | 'assay',
        useSnapshotSelection?: boolean,
        rowIds?: string[] | number[],
        picklistName?: string
    ) => Promise<CrossFolderSelectionResult>;
    getDataOperationConfirmationData: (
        operation: DataOperation,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean
    ) => Promise<OperationConfirmationData>;
    getDeleteConfirmationData: (options: GetDeleteConfirmationDataOptions) => Promise<OperationConfirmationData>;
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
    getOperationConfirmationData: (
        dataType: EntityDataType,
        rowIds: string[] | number[],
        selectionKey?: string,
        useSnapshotSelection?: boolean,
        extraParams?: Record<string, any>,
        containerPath?: string
    ) => Promise<OperationConfirmationData>;
    getOperationConfirmationDataForModel: (
        model: QueryModel,
        dataType: EntityDataType,
        extraParams?: Record<string, any>
    ) => Promise<OperationConfirmationData>;
    getOriginalParentsFromLineage: (
        lineage: Record<string, any>,
        parentDataTypes: EntityDataType[],
        containerPath?: string
    ) => Promise<{
        originalParents: Record<string, List<EntityChoice>>;
        parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    }>;
    getParentTypeDataForLineage: GetParentTypeDataForLineage;
    handleEntityFileImport: (
        importAction: string,
        queryInfo: QueryInfo,
        file: File,
        insertOption: InsertOptions,
        useAsync: boolean,
        importParameters?: Record<string, any>,
        importFileController?: string,
        saveToPipeline?: boolean,
        containerPath?: string,
        auditUserComment?: string
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
    moveEntities: (options: MoveEntitiesOptions) => Promise<Query.MoveRowsResponse>;
    isDataTypeEmpty: (dataType: ProjectConfigurableDataType,
                      lsid?: string,
                      rowId?: number,
                      containerPath?: string) => Promise<boolean>;
}

export class EntityServerAPIWrapper implements EntityAPIWrapper {
    getCrossFolderSelectionResult = getCrossFolderSelectionResult;
    getDataOperationConfirmationData = getDataOperationConfirmationData;
    getDeleteConfirmationData = getDeleteConfirmationData;
    getMoveConfirmationData = getMoveConfirmationData;
    getEntityTypeData = getEntityTypeData;
    getOperationConfirmationData = getOperationConfirmationData;
    getOperationConfirmationDataForModel = getOperationConfirmationDataForModel;
    getOriginalParentsFromLineage = getOriginalParentsFromLineage;
    getParentTypeDataForLineage = getParentTypeDataForLineage;
    handleEntityFileImport = handleEntityFileImport;
    loadNameExpressionOptions = loadNameExpressionOptions;
    moveEntities = moveEntities;
    initParentOptionsSelects = initParentOptionsSelects;
    isDataTypeEmpty = isDataTypeEmpty;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getEntityTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<EntityAPIWrapper> = {}
): EntityAPIWrapper {
    return {
        getCrossFolderSelectionResult: mockFn(),
        getDataOperationConfirmationData: mockFn(),
        getDeleteConfirmationData: mockFn(),
        getMoveConfirmationData: mockFn(),
        getEntityTypeData: mockFn(),
        getOperationConfirmationData: mockFn(),
        getOperationConfirmationDataForModel: mockFn(),
        getOriginalParentsFromLineage: mockFn(),
        getParentTypeDataForLineage: mockFn(),
        handleEntityFileImport: mockFn(),
        loadNameExpressionOptions: mockFn(),
        moveEntities: mockFn(),
        initParentOptionsSelects: mockFn(),
        isDataTypeEmpty: mockFn(),
        ...overrides,
    };
}
