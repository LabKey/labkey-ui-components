import { User } from '../base/models/User';
import { App } from '../../..';

export function getOmittedSampleTypeColumns(user: User, omitCols?: string[]): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push('checkedOutBy');
    } else if (omitCols && !App.isFreezerManagementEnabled()) {
        cols = cols.concat(omitCols);
    }

    return cols;
}
