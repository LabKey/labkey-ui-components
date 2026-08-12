/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, Query, Utils } from '@labkey/api';

import { User } from '../base/models/User';

import { isFreezerManagementEnabled } from '../../app/products';
import {
    hasActiveProjectColors,
    isProductFoldersEnabled,
    isProjectContainer,
    isSampleStatusEnabled,
} from '../../app/utils';

import { OperationConfirmationData } from '../entities/models';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { ModuleContext } from '../base/ServerContext';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { SystemField } from '../domainproperties/models';

import {
    DEFAULT_AVAILABLE_STATUS_COLOR,
    DEFAULT_CONSUMED_STATUS_COLOR,
    DEFAULT_LOCKED_STATUS_COLOR,
    operationRestrictionMessage,
    permittedOps,
    SAMPLE_COLOR_COLUMN_NAME,
    SAMPLE_COLOR_REQUIRED_COLUMNS,
    SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS,
    SAMPLE_DOMAIN_INVENTORY_SYSTEM_FIELDS,
    SAMPLE_STATE_COLOR_COLUMN_NAME,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
} from './constants';

import { SampleState, SampleStateType, SampleStatus } from './models';
import { Row } from '../../query/selectRows';

export function getOmittedSampleTypeColumns(user: User, moduleContext?: ModuleContext): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push(SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD);
    }
    if (!isFreezerManagementEnabled(moduleContext)) {
        cols = cols.concat(SCHEMAS.INVENTORY.INVENTORY_COLS);
    }
    if (!hasActiveProjectColors(moduleContext)) {
        cols = cols.concat(SAMPLE_COLOR_REQUIRED_COLUMNS);
    }

    return cols;
}

export function isSampleOperationPermitted(
    sampleStatusType: SampleStateType,
    operation: SampleOperation,
    moduleContext?: ModuleContext
): boolean {
    // everything is possible when not tracking status
    if (!isSampleStatusEnabled(moduleContext)) return true;

    // no status provided means all operations are permitted
    if (!sampleStatusType) return true;

    return permittedOps[sampleStatusType].has(operation);
}

export function getSampleStatusType(row: Row): SampleStateType {
    return (
        caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'StatusType')?.value
    );
}

export function getSampleStatusColor(color: string, stateType: SampleStateType | string): string {
    if (color && Utils.isString(color)) return color.toUpperCase();

    const _stateType = SampleStateType[stateType];

    switch (_stateType) {
        case SampleStateType.Available:
            return DEFAULT_AVAILABLE_STATUS_COLOR;
        case SampleStateType.Consumed:
            return DEFAULT_CONSUMED_STATUS_COLOR;
        case SampleStateType.Locked:
            return DEFAULT_LOCKED_STATUS_COLOR;
        default:
            return null;
    }
}

export function getSampleStatusFromSampleRow(row: Row): SampleStatus {
    let label: string;
    let rowId: number;
    // Issue 45269. If the state columns are present, don't look at a column named 'Label'
    let field = caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME);
    if (field) {
        rowId = field.value;
        label = field.displayValue;
    } else {
        field = caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_COLUMN_NAME);
        if (field) {
            rowId = field.value;
            label = field.displayValue;
        }
    }
    let color: string;
    let col = caseInsensitive(row, SAMPLE_STATE_COLOR_COLUMN_NAME);
    if (col) {
        color = col.value;
    } else {
        col = caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_COLOR_COLUMN_NAME);
        if (col) {
            color = col.value;
        }
    }
    let description: string;
    col = caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME);
    if (col) {
        description = col.value;
    } else {
        col = caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_DESCRIPTION_COLUMN_NAME);
        if (col) {
            description = col.value;
        }
    }
    return {
        label,
        rowId,
        statusType: getSampleStatusType(row),
        color,
        description,
    };
}

export function getSampleStatus(row: Row): SampleStatus {
    return {
        label: caseInsensitive(row, 'Label')?.value,
        rowId: caseInsensitive(row, 'RowId')?.value,
        statusType: getSampleStatusType(row),
        color: caseInsensitive(row, 'Color')?.value,
        description: caseInsensitive(row, 'Description')?.value,
    };
}

export function getFilterForSampleOperation(
    operation: SampleOperation,
    allowed = true,
    moduleContext?: ModuleContext
): Filter.IFilter | undefined {
    if (!isSampleStatusEnabled(moduleContext)) return undefined;

    const typesNotAllowed: string[] = [];
    for (const stateType in SampleStateType) {
        if (!permittedOps[stateType].has(operation)) {
            typesNotAllowed.push(stateType);
        }
    }
    if (typesNotAllowed.length === 0) return undefined;

    const filterType = allowed ? Filter.Types.NOT_IN : Filter.Types.IN;
    return Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed, filterType);
}

function getOperationMessageAndRecommendation(operation: SampleOperation, numSamples: number, isAll?: boolean): string {
    if (isAll) {
        return operationRestrictionMessage[operation].all;
    } else {
        const messageInfo = operationRestrictionMessage[operation];
        let message: string;
        if (numSamples === 1) {
            message = operationRestrictionMessage[operation].singular;
        } else {
            message = operationRestrictionMessage[operation].plural;
        }
        if (messageInfo.recommendation) {
            return message + '. ' + messageInfo.recommendation;
        }
        return message;
    }
}

export function getOperationNotAllowedMessageFromCounts(
    operation: SampleOperation,
    totalCount: number,
    notAllowedCount: number
): string {
    if (!totalCount || !notAllowedCount) return null;

    if (notAllowedCount === totalCount) {
        return `All selected samples have a status or related data that prevents ${operationRestrictionMessage[operation].all}.`;
    }

    const noun = notAllowedCount === 1 ? 'sample' : 'samples';
    const count = notAllowedCount.toLocaleString();
    const operationMsg = getOperationMessageAndRecommendation(operation, notAllowedCount, false);
    return `The current status of ${count} selected ${noun} prevents ${operationMsg}.`;
}

/**
 * Note: totalCount is needed because OperationConfirmationData doesn't include selections that have been deleted, so we
 * need to pass a separate totalCount variable to avoid producing confusing error messages.
 * e.g. if you made 3 selections, 2 were deleted, and 1 has invalid status, then you wouldn't want to say "All selected
 * samples".
 *
 * TODO: update all usages of getOperationNotAllowedMessage to pass in totalCount so they don't suffer from the
 *  selection issue outlined above.
 */
export function getOperationNotAllowedMessage(
    operation: SampleOperation,
    statusData: OperationConfirmationData,
    aliquotIds?: number[],
    totalCount?: number
): string {
    if (!statusData) return null;

    const noAliquots = !aliquotIds || aliquotIds.length === 0;
    let notAllowed = [];
    // no aliquots or only aliquots, we show a status message about all that are not allowed
    if (noAliquots || aliquotIds.length === statusData.totalCount) {
        notAllowed = statusData.notAllowed;
    } else {
        // some aliquots, some not, filter out the aliquots from the status message
        notAllowed = statusData.notAllowed.filter(data => aliquotIds.indexOf(caseInsensitive(data, 'rowId')) < 0);
    }

    return getOperationNotAllowedMessageFromCounts(operation, totalCount ?? statusData.totalCount, notAllowed.length);
}

/**
 * See intent behind totalCount in comment above for getOperationNotAllowedMessage
 */
export function getOperationNotPermittedMessage(
    statusData: OperationConfirmationData,
    nounSingular: string,
    nounPlural: string,
    totalCount: number
): string {
    if (!statusData || statusData.notPermitted.length === 0) return null;

    const notPermittedCount = statusData.notPermitted.length;
    const noun = (notPermittedCount === 1 ? nounSingular : nounPlural).toLowerCase();
    const countStr = notPermittedCount.toLocaleString();

    if (notPermittedCount < totalCount) {
        let message = `The selection includes ${countStr} ${noun} that you do not have permission to edit. `;
        message += `Updates will only be made to the ${nounPlural.toLowerCase()} you have edit permission for.`;
        return message;
    }

    const amountText = notPermittedCount > 1 ? 'any of the' : 'the';
    return `You do not have permission to edit ${amountText} selected ${noun}.`;
}

export enum SamplesEditButtonSections {
    DELETE = 'delete',
    EDIT = 'edit',
    EDIT_PARENT = 'editparent',
    FIND_DERIVATIVES = 'findderivatives',
    IMPORT = 'import',
    LINK_TO_STUDY = 'linktostudy',
    MOVE_TO_FOLDER = 'movetofolder',
}

export function isFindBySampleSchema(schemaQuery: SchemaQuery): boolean {
    return schemaQuery?.hasSchema(SCHEMAS.EXP_TABLES.SCHEMA) && schemaQuery.queryStartsWith('exp_temp_');
}

export function isSamplesSchema(schemaQuery: SchemaQuery): boolean {
    return schemaQuery?.hasSchema(SCHEMAS.SAMPLE_SETS.SCHEMA) || isAllSamplesSchema(schemaQuery);
}

export function isWorkflowInputSamplesSchema(schemaQuery: SchemaQuery): boolean {
    return SCHEMAS.WORKFLOW.JOB_INPUT_SAMPLES.isEqual(schemaQuery, false);
}

export function isAllSamplesSchema(schemaQuery: SchemaQuery): boolean {
    if (!schemaQuery) return false;
    if (SCHEMAS.EXP_TABLES.MATERIALS.isEqual(schemaQuery, false)) return true;
    if (isFindBySampleSchema(schemaQuery)) return true;

    if (schemaQuery.hasSchema(SCHEMAS.SAMPLE_MANAGEMENT.SCHEMA)) {
        return SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES.isEqual(schemaQuery, false);
    }

    return isWorkflowInputSamplesSchema(schemaQuery);
}

export function getSampleDomainDefaultSystemFields(moduleContext?: ModuleContext): SystemField[] {
    const fields = isFreezerManagementEnabled(moduleContext)
        ? SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS.concat(SAMPLE_DOMAIN_INVENTORY_SYSTEM_FIELDS)
        : SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS;

    if (!hasActiveProjectColors(moduleContext)) {
        return fields.filter(field => field.Name !== SAMPLE_COLOR_COLUMN_NAME);
    }

    return fields;
}

export function getSampleStatusLockedMessage(state: SampleState, saving: boolean): string | undefined {
    const msgs: string[] = [];
    if (state?.inUse || saving) msgs.push('cannot change status type or be deleted because it is in use');
    if (state && !state.isLocal)
        msgs.push('can be changed only in the ' + state.containerPath.substring(1) + ' folder');
    if (msgs.length > 0) return 'This sample status ' + msgs.join(' and ') + '.';
    return undefined;
}

export function getSampleStatusContainerFilter(
    forLegend?: boolean,
    containerPath?: string,
    moduleContext?: ModuleContext
): Query.ContainerFilter {
    // Check to see if product folders support is enabled.
    if (!isProductFoldersEnabled(moduleContext)) {
        return undefined;
    }

    // The legend should show statuses for all the samples that can be seen in the project.
    if (forLegend && isProjectContainer(containerPath)) {
        return Query.ContainerFilter.currentAndSubfoldersPlusShared;
    }

    // When requesting data from a subfolder context, the ContainerFilter filters
    // "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}
