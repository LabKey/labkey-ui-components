import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import { QueryInfo } from '../../public/QueryInfo';
import {
    DataTypeEntity,
    EntityDataType,
    IEntityTypeOption,
    ProjectConfigurableDataType,
} from '../components/entities/models';
import { getEntityTypeOptions, getProjectConfigurableEntityTypeOptions } from '../components/entities/actions';
import { getProjectDataTypeDataCount, getDataTypeProjectDataCount } from '../components/project/actions';

import {
    deleteView,
    getGridViews,
    GetSelectedResponse,
    getSnapshotSelections,
    incrementClientSideMetricCount,
    renameGridView,
    saveGridView,
    saveSessionView,
    SelectResponse,
    setSnapshotSelections,
} from '../actions';

import { SchemaQuery } from '../../public/SchemaQuery';

import { ViewInfo } from '../ViewInfo';

import { QueryColumn } from '../../public/QueryColumn';

import {
    deleteRows,
    deleteRowsByContainer,
    DeleteRowsOptions,
    getQueryDetails,
    GetQueryDetailsOptions,
    insertRows,
    InsertRowsOptions,
    QueryCommandResponse,
    selectDistinctRows,
    updateRows,
    UpdateRowsOptions,
    getDefaultVisibleColumns,
} from './api';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';

export interface QueryAPIWrapper {
    deleteRows: (options: DeleteRowsOptions) => Promise<QueryCommandResponse>;
    deleteRowsByContainer: (options: DeleteRowsOptions, containerField: string) => Promise<any>;
    deleteView: (schemaQuery: SchemaQuery, containerPath: string, viewName?: string, revert?: boolean) => Promise<void>;
    getDataTypeProjectDataCount: (
        entityDataType: EntityDataType,
        dataTypeRowId: number,
        dataTypeName: string
    ) => Promise<Record<string, number>>;
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getGridViews: (
        schemaQuery: SchemaQuery,
        sort?: boolean,
        viewName?: string,
        excludeSessionView?: boolean,
        includeHidden?: boolean
    ) => Promise<ViewInfo[]>;
    getProjectConfigurableEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string,
        containerFilter?: Query.ContainerFilter
    ) => Promise<DataTypeEntity[]>;
    getProjectDataTypeDataCount: (
        dataType: ProjectConfigurableDataType,
        containerPath?: string,
        allDataTypes?: DataTypeEntity[],
        isNewFolder?: boolean
    ) => Promise<Record<string, number>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    getSnapshotSelections: (key: string, containerPath?: string) => Promise<GetSelectedResponse>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    insertRows: (options: InsertRowsOptions) => Promise<QueryCommandResponse>;
    renameGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string
    ) => Promise<void>;
    saveGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewInfo: ViewInfo,
        replace: boolean,
        session: boolean,
        inherit: boolean,
        shared: boolean
    ) => Promise<void>;
    saveSessionView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string,
        inherit?: boolean,
        shared?: boolean,
        replace?: boolean
    ) => Promise<void>;
    selectDistinctRows: (selectDistinctOptions: Query.SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
    setSnapshotSelections: (key: string, ids: string[] | string, containerPath?: string) => Promise<SelectResponse>;
    updateRows: (options: UpdateRowsOptions) => Promise<QueryCommandResponse>;
    getDefaultVisibleColumns: (options: GetQueryDetailsOptions) => Promise<QueryColumn[]>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    deleteRows = deleteRows;
    deleteRowsByContainer = deleteRowsByContainer;
    deleteView = deleteView;
    getDataTypeProjectDataCount = getDataTypeProjectDataCount;
    getEntityTypeOptions = getEntityTypeOptions;
    getGridViews = getGridViews;
    getProjectConfigurableEntityTypeOptions = getProjectConfigurableEntityTypeOptions;
    getProjectDataTypeDataCount = getProjectDataTypeDataCount;
    getQueryDetails = getQueryDetails;
    getSnapshotSelections = getSnapshotSelections;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    insertRows = insertRows;
    renameGridView = renameGridView;
    saveGridView = saveGridView;
    saveSessionView = saveSessionView;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    setSnapshotSelections = setSnapshotSelections;
    updateRows = updateRows;
    getDefaultVisibleColumns = getDefaultVisibleColumns;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getQueryTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<QueryAPIWrapper> = {}
): QueryAPIWrapper {
    return {
        deleteRows: mockFn(),
        deleteRowsByContainer: mockFn(),
        deleteView: mockFn(),
        getDataTypeProjectDataCount: mockFn(),
        getEntityTypeOptions: mockFn(),
        getGridViews: mockFn(),
        getProjectConfigurableEntityTypeOptions: mockFn(),
        getProjectDataTypeDataCount: mockFn(),
        getQueryDetails: mockFn(),
        getSnapshotSelections: mockFn(),
        incrementClientSideMetricCount: mockFn(),
        insertRows: mockFn(),
        renameGridView: mockFn(),
        saveGridView: mockFn(),
        saveSessionView: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        setSnapshotSelections: mockFn(),
        updateRows: mockFn(),
        getDefaultVisibleColumns: mockFn(),
        ...overrides,
    };
}
