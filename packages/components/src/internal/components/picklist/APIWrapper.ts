import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';

import {
    getPicklistCountsBySampleType,
    getPicklistDeleteData,
    getPicklistFromId,
    PicklistDeletionData,
    SampleTypeCount,
} from './actions';
import { Picklist } from './models';

export interface PicklistAPIWrapper {
    getPicklistCountsBySampleType: (listName: string) => Promise<SampleTypeCount[]>;
    getPicklistDeleteData: (model: QueryModel, user: User) => Promise<PicklistDeletionData>;
    getPicklistFromId: (listId: number, loadSampleTypes?: boolean) => Promise<Picklist>;
}

export class PicklistServerAPIWrapper implements PicklistAPIWrapper {
    getPicklistCountsBySampleType = getPicklistCountsBySampleType;
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
        getPicklistCountsBySampleType: () => Promise.resolve([]),
        getPicklistDeleteData: mockFn(),
        getPicklistFromId: mockFn(),
        ...overrides,
    };
}
