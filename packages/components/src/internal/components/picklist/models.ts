import { Draft, immerable, produce } from 'immer';

import { User } from '../base/models/User';
import { PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { userCanDeletePublicPicklists, userCanManagePicklists } from '../../app/utils';
import { flattenValuesFromRow } from '../../../public/QueryModel/utils';

export const PICKLIST_SAMPLE_ID_COLUMN = 'SampleID';
export const PICKLIST_KEY_COLUMN = 'id';

export class Picklist {
    [immerable] = true;

    readonly Category: string;
    readonly CreatedBy: number;
    readonly CreatedByDisplay: string;
    readonly Created: string;
    readonly name: string;
    readonly listId: number;
    readonly Description: string;
    readonly ItemCount: number;

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
        return produce(this, (draft: Draft<Picklist>) => {
            Object.assign(draft, props);
        });
    }
}
