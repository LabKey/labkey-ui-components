import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import { QueryInfo } from '../../public/QueryInfo';
import { EntityDataType, IEntityTypeOption } from '../components/entities/models';
import { getEntityTypeOptions } from '../components/entities/actions';

import { getGridViews, incrementClientSideMetricCount } from '../actions';

import { getQueryDetails, GetQueryDetailsOptions, SelectDistinctResponse, selectDistinctRows } from './api';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';
import { SchemaQuery } from "../../public/SchemaQuery";
import { ViewInfo } from "../ViewInfo";

export interface QueryAPIWrapper {
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
    selectDistinctRows: (selectDistinctOptions: Query.SelectDistinctOptions) => Promise<SelectDistinctResponse>;
    getGridViews: (
        schemaQuery: SchemaQuery,
        viewName?: string,
        excludeSessionView?: boolean
    ) => Promise<ViewInfo[]>
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    getEntityTypeOptions = getEntityTypeOptions;
    getQueryDetails = getQueryDetails;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    getGridViews = getGridViews;
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
        getGridViews: mockFn,
        ...overrides,
    };
}
