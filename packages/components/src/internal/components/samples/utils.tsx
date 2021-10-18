import React, { ReactNode } from 'react';

import { Filter } from '@labkey/api';

import { User } from '../base/models/User';
import {
    App,
    caseInsensitive,
    LoadingSpinner, OperationConfirmationData,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleStateType,
} from '../../..';

import { isSampleStatusEnabled } from '../../app/utils';

import { operationRestrictionMessage, permittedOps, SAMPLE_STATE_COLUMN_NAME, SampleOperation } from './constants';

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

function getOperationMessageAndRecommendation(operation: SampleOperation, numSamples: number, isAll?: boolean): string {
    if (isAll) {
        return operationRestrictionMessage[operation].all;
    } else {
        const messageInfo = operationRestrictionMessage[operation];
        let message;
        if (numSamples == 1) {
            message = operationRestrictionMessage[operation].singular + '.';
        } else {
            message = operationRestrictionMessage[operation].plural + '.';
        }
        if (messageInfo.recommendation) {
            return message + '. ' + messageInfo.recommendation;
        }
        return message;
    }
}

export function getOperationNotPermittedMessage(operation: SampleOperation, confirmationData: OperationConfirmationData, aliquotIds?: number[]): string {

    let notAllowedMsg = null;

    if (confirmationData) {
        if (confirmationData.noneAllowed) {
            return `All selected samples have a status that prevents ${operationRestrictionMessage[operation].all}.`;
        }

        const onlyAliquots = aliquotIds?.length === confirmationData.totalCount;
        const noAliquots = !aliquotIds || aliquotIds.length == 0;
        let notAllowed = [];
        if (onlyAliquots || noAliquots) {
            notAllowed = confirmationData.notAllowed;
        } else { // some aliquots, some not
            notAllowed = confirmationData.notAllowed.filter(data => aliquotIds.indexOf(caseInsensitive(data, 'rowId')) < 0);
        }
        if (notAllowed?.length > 0) {
            notAllowedMsg =
                `The current status of ${notAllowed.length} selected sample${notAllowed.length == 1 ? ' ' : 's '}
                  prevents ${getOperationMessageAndRecommendation(operation, notAllowed.length, false)}`;
        }
    }

    return notAllowedMsg;
}
