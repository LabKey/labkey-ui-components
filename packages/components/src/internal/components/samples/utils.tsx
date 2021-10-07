import React from 'react';
import { User } from '../base/models/User';
import {
    App,
    caseInsensitive,
    LoadingSpinner,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME, SampleStateTypes
} from '../../..';
import { permittedOps, SAMPLE_STATE_COLUMN_NAME, SampleOperations } from './constants';
import { isSampleStatusEnabled } from '../../app/utils';
import { ReactNode } from 'react';
import { SampleStatus } from './models';
import { Filter } from '@labkey/api';

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

export function getSampleStatus(row: any): SampleStatus {
    return {
        label: caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME)?.displayValue,
        statusType: caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value,
        description: caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value,
    }
}

export function getFilterArrayForSampleOperation(operation: SampleOperations): Filter.IFilter[] {
    if (!isSampleStatusEnabled())
        return [];

    let typesAllowed = [];
    let typesNotAllowed = [];
    for (let stateType in SampleStateTypes) {
        if (permittedOps[stateType].has(operation))
            typesAllowed.push(stateType);
        else
            typesNotAllowed.push(stateType);
    }
    if (typesNotAllowed.length == 0)
        return [];
    if (typesNotAllowed.length == 1)
        return [Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed[0], Filter.Types.NEQ)];
    if (typesAllowed.length == 1)
        return [Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesAllowed[0], Filter.Types.EQ)];
    return [Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesAllowed, Filter.Types.IN)];
}

