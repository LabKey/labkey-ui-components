import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';

import { getPicklistDeleteData, PicklistDeletionData } from './actions';

export interface PicklistAPIWrapper {
    getPicklistDeleteData: (model: QueryModel, user: User) => Promise<PicklistDeletionData>;
}

export class PicklistServerAPIWrapper implements PicklistAPIWrapper {
    getPicklistDeleteData = getPicklistDeleteData;
}

export const getDefaultPicklistAPIWrapper = (): PicklistAPIWrapper => new PicklistServerAPIWrapper();

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getTestPicklistAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<PicklistAPIWrapper> = {}
): PicklistAPIWrapper {
    return {
        getPicklistDeleteData: mockFn(),
        ...overrides,
    };
}
