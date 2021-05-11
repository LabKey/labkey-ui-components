import { Draft, immerable, produce } from 'immer';
import { User } from '../base/models/User';
import { PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { userCanDeletePublicPicklists, userCanManagePicklists } from '../../app/utils';

export class PicklistModel {
    [immerable] = true;

    readonly Category: string;
    readonly CreatedBy: number;
    readonly name: string;
    readonly listId: number;
    readonly Description: string;

    constructor(values?: Partial<PicklistModel>) {
        Object.assign(this, values);
    }

    isValid(): boolean {
        return !!this.name;
    }

    isUserList(user: User): boolean {
        return this.CreatedBy === user.id
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
