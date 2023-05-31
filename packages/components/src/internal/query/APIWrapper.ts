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

import { getQueryDetails, GetQueryDetailsOptions, selectDistinctRows } from './api';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';

export interface QueryAPIWrapper {
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
    getDataTypeProjectDataCount: (
        entityDataType: EntityDataType,
        dataTypeRowId: number,
        dataTypeName: string
    ) => Promise<Record<string, number>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    selectDistinctRows: (selectDistinctOptions: Query.SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    getEntityTypeOptions = getEntityTypeOptions;
    getQueryDetails = getQueryDetails;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    getGridViews = getGridViews;
    getProjectConfigurableEntityTypeOptions = getProjectConfigurableEntityTypeOptions;
    getProjectDataTypeDataCount = getProjectDataTypeDataCount;
    getDataTypeProjectDataCount = getDataTypeProjectDataCount;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getQueryTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<QueryAPIWrapper> = {}
): QueryAPIWrapper {
    return {
        getEntityTypeOptions: mockFn(),
        getQueryDetails: mockFn(),
        incrementClientSideMetricCount: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        getGridViews: mockFn(),
        getProjectConfigurableEntityTypeOptions: mockFn(),
        getProjectDataTypeDataCount: mockFn(),
        getDataTypeProjectDataCount: mockFn(),
        ...overrides,
    };
}
