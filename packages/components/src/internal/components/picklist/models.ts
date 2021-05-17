import { Draft, immerable, produce } from 'immer';

import { User } from '../base/models/User';
import { PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { userCanDeletePublicPicklists, userCanManagePicklists } from '../../app/utils';
import { flattenValuesFromRow } from '../../../public/QueryModel/utils';

export class PicklistModel {
    [immerable] = true;

    readonly Category: string;
    readonly CreatedBy: number;
    readonly CreatedByDisplay: string;
    readonly Created: string;
    readonly name: string;
    readonly listId: number;
    readonly Description: string;

    static create(data: any) {
        return new PicklistModel({
            ...flattenValuesFromRow(data, Object.keys(data)),
            CreatedByDisplay: data.CreatedBy?.displayValue,
        });
    }

    constructor(values?: Partial<PicklistModel>) {
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

    mutate(props: Partial<PicklistModel>): PicklistModel {
        return produce(this, (draft: Draft<PicklistModel>) => {
            Object.assign(draft, props);
        });
    }
}
