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

import { getGridViews, incrementClientSideMetricCount } from '../actions';

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
    selectDistinctRows: (selectDistinctOptions: Query.SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
    updateRows: (options: UpdateRowsOptions) => Promise<UpdateRowsResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    deleteRows = deleteRows;
    getDataTypeProjectDataCount = getDataTypeProjectDataCount;
    getEntityTypeOptions = getEntityTypeOptions;
    getGridViews = getGridViews;
    getProjectConfigurableEntityTypeOptions = getProjectConfigurableEntityTypeOptions;
    getProjectDataTypeDataCount = getProjectDataTypeDataCount;
    getQueryDetails = getQueryDetails;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    insertRows = insertRows;
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
        getDataTypeProjectDataCount: mockFn(),
        getEntityTypeOptions: mockFn(),
        getGridViews: mockFn(),
        getProjectConfigurableEntityTypeOptions: mockFn(),
        getProjectDataTypeDataCount: mockFn(),
        getQueryDetails: mockFn(),
        incrementClientSideMetricCount: mockFn(),
        insertRows: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        updateRows: mockFn(),
        ...overrides,
    };
}
