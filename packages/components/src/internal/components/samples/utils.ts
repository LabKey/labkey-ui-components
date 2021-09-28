import { User } from '../base/models/User';
import { App } from '../../../index';

export function getOmittedSampleTypeColumns(user: User, inventoryCols = null): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push('checkedOutBy');
    } else if (inventoryCols && !App.isFreezerManagementEnabled()) {
        cols.concat(inventoryCols);
    }

    return cols;
}
