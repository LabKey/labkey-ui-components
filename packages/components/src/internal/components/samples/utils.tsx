import React, { ReactNode } from 'react';

import { Filter } from '@labkey/api';

import { User } from '../base/models/User';
import {
    App,
    caseInsensitive,
    LoadingSpinner,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleStateType,
} from '../../..';

import { isSampleStatusEnabled } from '../../app/utils';

import { permittedOps, SAMPLE_STATE_COLUMN_NAME, SampleOperation } from './constants';

import { SampleStatus } from './models';

export function getOmittedSampleTypeColumns(user: User, omitCols?: string[]): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push('checkedOutBy');
    } else if (omitCols && !App.isFreezerManagementEnabled()) {
        cols = cols.concat(omitCols);
    }

    return cols;
}

export function isSampleOperationPermitted(sampleStatusType: SampleStateType, operation: SampleOperation): boolean {
    if (!isSampleStatusEnabled())
        // everything is possible when not tracking status
        return true;

    if (!sampleStatusType)
        // no status provided means all operations are permitted
        return true;

    return permittedOps[sampleStatusType].has(operation);
}

export function getSampleDeleteMessage(canDelete: boolean, deleteInfoError: boolean): ReactNode {
    let deleteMsg;
    if (canDelete === undefined) {
        deleteMsg = <LoadingSpinner msg="Loading delete confirmation data..." />;
    } else if (!canDelete) {
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

export function getSampleStatusType(row: any): SampleStateType {
    return caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value;
}

export function getSampleStatus(row: any): SampleStatus {
    return {
        label: caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME)?.displayValue,
        statusType: getSampleStatusType(row),
        description: caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value,
    };
}

export function getFilterForSampleOperation(operation: SampleOperation): Filter.IFilter {
    if (!isSampleStatusEnabled()) return null;

    const typesNotAllowed = [];
    for (const stateType in SampleStateType) {
        if (!permittedOps[stateType].has(operation)) typesNotAllowed.push(stateType);
    }
    if (typesNotAllowed.length == 0) return null;

    return Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed, Filter.Types.NOT_IN);
}
