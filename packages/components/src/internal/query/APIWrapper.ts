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
    incrementClientSideMetricCount,
    renameGridView,
    saveGridView,
    saveSessionView,
} from '../actions';

import { SchemaQuery } from '../../public/SchemaQuery';

import { ViewInfo } from '../ViewInfo';

import {
    deleteRows,
    DeleteRowsOptions,
    DeleteRowsResponse,
    getQueryDetails,
    GetQueryDetailsOptions,
    insertRows,
    InsertRowsOptions,
    InsertRowsResponse,
    selectDistinctRows,
    updateRows,
    UpdateRowsOptions,
    UpdateRowsResponse,
} from './api';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';

export interface QueryAPIWrapper {
    deleteRows: (options: DeleteRowsOptions) => Promise<DeleteRowsResponse>;
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
        allDataTypes?: DataTypeEntity[],
        isNewFolder?: boolean
    ) => Promise<Record<string, number>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    insertRows: (options: InsertRowsOptions) => Promise<InsertRowsResponse>;
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
    updateRows: (options: UpdateRowsOptions) => Promise<UpdateRowsResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    deleteRows = deleteRows;
    deleteView = deleteView;
    getDataTypeProjectDataCount = getDataTypeProjectDataCount;
    getEntityTypeOptions = getEntityTypeOptions;
    getGridViews = getGridViews;
    getProjectConfigurableEntityTypeOptions = getProjectConfigurableEntityTypeOptions;
    getProjectDataTypeDataCount = getProjectDataTypeDataCount;
    getQueryDetails = getQueryDetails;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    insertRows = insertRows;
    renameGridView = renameGridView;
    saveGridView = saveGridView;
    saveSessionView = saveSessionView;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    updateRows = updateRows;
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
        deleteView: mockFn(),
        getDataTypeProjectDataCount: mockFn(),
        getEntityTypeOptions: mockFn(),
        getGridViews: mockFn(),
        getProjectConfigurableEntityTypeOptions: mockFn(),
        getProjectDataTypeDataCount: mockFn(),
        getQueryDetails: mockFn(),
        incrementClientSideMetricCount: mockFn(),
        insertRows: mockFn(),
        renameGridView: mockFn(),
        saveGridView: mockFn(),
        saveSessionView: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        updateRows: mockFn(),
        ...overrides,
    };
}
