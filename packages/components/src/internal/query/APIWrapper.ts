import {List, Map} from 'immutable';
import {getQueryDetails, GetQueryDetailsOptions} from "./api";
import {QueryInfo} from "../../public/QueryInfo";
import {EntityDataType, IEntityTypeOption} from "../components/entities/models";
import {getEntityTypeOptions} from "../components/entities/actions";


export interface QueryAPIWrapper {
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    getEntityTypeOptions = getEntityTypeOptions;
    getQueryDetails = getQueryDetails;
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
        ...overrides,
    };
}
