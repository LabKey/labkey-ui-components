import React from 'react';
import { User } from '../base/models/User';
import { App, caseInsensitive, LoadingSpinner, SAMPLE_STATE_TYPE_COLUMN_NAME } from '../../..';
import { permittedOps, SampleOperations } from './constants';
import { isSampleStatusEnabled } from '../../app/utils';
import { ReactNode } from 'react';

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

export function getSampleDeleteMessage(canDelete: boolean, deleteInfoError: boolean): ReactNode {
    let deleteMsg;
    if (canDelete === undefined) {
        deleteMsg = <LoadingSpinner msg="Loading delete confirmation data..." />;
    } else if (canDelete === false) {
        deleteMsg = 'This sample cannot be deleted because ';
        if (deleteInfoError) {
            deleteMsg += 'there was a problem loading the delete confirmation data.';
        } else {
            deleteMsg += 'it has either derived sample or assay data dependencies';
            if (App.isSampleStatusEnabled()) {
                deleteMsg += ' or status that prevents deletion';
            }
            deleteMsg += '. Check the Lineage and Assays tabs for this sample to get more information.';
        }
    }
    return deleteMsg;
}
