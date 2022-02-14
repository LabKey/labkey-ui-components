import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

import { QueryInfo } from '../../public/QueryInfo';
import { EntityDataType, IEntityTypeOption } from '../components/entities/models';
import { getEntityTypeOptions } from '../components/entities/actions';

import { incrementClientSideMetricCount } from '../actions';

import { getQueryDetails, GetQueryDetailsOptions, SelectDistinctResponse, selectDistinctRows } from './api';

export interface QueryAPIWrapper {
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    selectDistinctRows: (selectDistinctOptions: Query.SelectDistinctOptions) => Promise<SelectDistinctResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    getEntityTypeOptions = getEntityTypeOptions;
    getQueryDetails = getQueryDetails;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    selectDistinctRows = selectDistinctRows;
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
        selectDistinctRows: mockFn(),
        ...overrides,
    };
}
