import { User } from '../base/models/User';
import { App } from '../../../index';

export function getOmittedSampleTypeColumns(user: User, omitCols = null): string[] {
    const cols: string[] = [];

    if (user.isGuest) {
        cols.push('checkedOutBy');
    } else if (omitCols && !App.isFreezerManagementEnabled()) {
        cols.concat(omitCols);
    }

    return cols;
}
