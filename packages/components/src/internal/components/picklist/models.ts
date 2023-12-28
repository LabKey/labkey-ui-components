import { immerable, produce } from 'immer';

import { Filter } from '@labkey/api';

import { User } from '../base/models/User';

import { userCanDeletePublicPicklists, userCanManagePicklists } from '../../app/utils';
import { flattenValuesFromRow } from '../../../public/QueryModel/QueryModel';

import { PUBLIC_PICKLIST_CATEGORY } from './constants';

export const PICKLIST_SAMPLE_ID_COLUMN = 'SampleID';
export const PICKLIST_KEY_COLUMN = 'id';

export class Picklist {
    [immerable] = true;

    readonly Container: string;
    readonly Category: string;
    readonly CreatedBy: number;
    readonly CreatedByDisplay: string;
    readonly Created: string;
    readonly name: string;
    readonly listId: number;
    readonly Description: string;
    readonly ItemCount: number;
    readonly sampleTypes?: string[];
    readonly hasMedia?: boolean;

    static create(data: any) {
        return new Picklist({
            ...flattenValuesFromRow(data, Object.keys(data)),
            CreatedByDisplay: data.CreatedBy?.displayValue,
        });
    }

    constructor(values?: Partial<Picklist>) {
        Object.assign(this, values);
    }

    isValid(): boolean {
        return this.name?.trim().length > 0;
    }

    isUserList(user: User): boolean {
        return this.CreatedBy === user.id;
    }

    isEditable(user: User): boolean {
        return this.isUserList(user) && userCanManagePicklists(user);
    }

    isPublic(): boolean {
        return this.Category === PUBLIC_PICKLIST_CATEGORY;
    }

    isDeletable(user: User): boolean {
        return this.isUserList(user) || (this.isPublic() && userCanDeletePublicPicklists(user));
    }

    canRemoveItems(user: User): boolean {
        return this.isUserList(user) || (this.isPublic() && userCanManagePicklists(user));
    }

    mutate(props: Partial<Picklist>): Picklist {
        return produce<Picklist>(this, draft => {
            Object.assign(draft, props);
        });
    }
}

/**
 * This implements the filter corresponding to PicklistSampleCompareType.  Updates there should also be reflected here.
 */
class PicklistSamplesFilter implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }
    getDisplayText(): string {
        return 'Sample for picklist';
    }
    getLongDisplayText(): string {
        return this.getDisplayText();
    }
    getURLSuffix(): string {
        return 'picklistsamples';
    }
    isDataValueRequired(): boolean {
        return true;
    }
    isMultiValued(): boolean {
        return false;
    }
    isTableWise(): boolean {
        return false;
    }
    getMultiValueFilter(): Filter.IFilterType {
        return null;
    }
    getMultiValueMaxOccurs(): number {
        return 0;
    }
    getMultiValueMinOccurs(): number {
        return 0;
    }
    getMultiValueSeparator(): string {
        return null;
    }
    getOpposite(): Filter.IFilterType {
        return null;
    }
    getSingleValueFilter(): Filter.IFilterType {
        return null;
    }
    parseValue(value: any) {
        return value;
    }
    getURLParameterValue(value: any) {
        return value;
    }
    validate(value: any, jsonType: string, columnName: string) {}
    getLabKeySqlOperator(): string {
        return null;
    }
}

export const PICKLIST_SAMPLES_FILTER = new PicklistSamplesFilter();
