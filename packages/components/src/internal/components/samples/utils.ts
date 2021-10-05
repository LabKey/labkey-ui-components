import { User } from '../base/models/User';
import { App, caseInsensitive, SAMPLE_STATE_TYPE_COLUMN_NAME } from '../../..';
import { permittedOps, SampleOperations } from './constants';
import { isSampleStatusEnabled } from '../../app/utils';

export function getOmittedSampleTypeColumns(user: User, omitCols?: string[]): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push('checkedOutBy');
    } else if (omitCols && !App.isFreezerManagementEnabled()) {
        cols = cols.concat(omitCols);
    }

    return cols;
}

export function isSampleOperationPermitted(data: string | any, operation: SampleOperations): boolean {
    if (!isSampleStatusEnabled()) // everything is possible when not tracking status
        return true;

    if (!data) // no status provided means all operations are permitted
        return true;

    const stateTypeString = (typeof data === 'string') ? data : caseInsensitive(data, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value;

    return !stateTypeString || permittedOps[stateTypeString].has(operation);
}
