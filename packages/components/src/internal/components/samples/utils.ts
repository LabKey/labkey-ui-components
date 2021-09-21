import { List } from 'immutable';
import {User} from "../base/models/User";
import {App} from "../../../index";

export function getOmittedSampleTypeColumns(user: User, inventoryCols = null): List<string> {
    let cols = List<string>();
    if (user.isGuest) {
        cols = cols.push('checkedOutBy');
    } else if (inventoryCols && !App.isFreezerManagementEnabled()) {
        cols = cols.push(...inventoryCols)
    }

    return cols;
}
