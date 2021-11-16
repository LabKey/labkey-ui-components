import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';

import { getPicklistDeleteData, getPicklistFromId, PicklistDeletionData } from './actions';
import { Picklist } from './models';

export interface PicklistAPIWrapper {
    getPicklistDeleteData: (model: QueryModel, user: User) => Promise<PicklistDeletionData>;
    getPicklistFromId: (listId: number) => Promise<Picklist>;
}

export class PicklistServerAPIWrapper implements PicklistAPIWrapper {
    getPicklistDeleteData = getPicklistDeleteData;
    getPicklistFromId = getPicklistFromId;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getPicklistTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<PicklistAPIWrapper> = {}
): PicklistAPIWrapper {
    return {
        getPicklistDeleteData: mockFn(),
        getPicklistFromId: mockFn(),
        ...overrides,
    };
}
