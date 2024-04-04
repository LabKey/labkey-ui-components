import { Filter, Query } from '@labkey/api';

import { User } from '../base/models/User';

import {
    isFreezerManagementEnabled,
    isProductProjectsEnabled,
    isProjectContainer,
    isSampleStatusEnabled,
} from '../../app/utils';

import { OperationConfirmationData } from '../entities/models';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { ModuleContext } from '../base/ServerContext';

import { SampleState, SampleStatus } from './models';

import {
    DEFAULT_AVAILABLE_STATUS_COLOR,
    DEFAULT_CONSUMED_STATUS_COLOR,
    DEFAULT_LOCKED_STATUS_COLOR,
    operationRestrictionMessage,
    permittedOps,
    SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS,
    SAMPLE_DOMAIN_INVENTORY_SYSTEM_FIELDS,
    SAMPLE_STATE_COLOR_COLUMN_NAME,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
    SampleStateType,
} from './constants';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { PICKLIST_SAMPLES_FILTER } from '../picklist/models';
import { SystemField } from '../domainproperties/models';

export function getOmittedSampleTypeColumns(user: User, moduleContext?: ModuleContext): string[] {
    let cols: string[] = [];

    if (user.isGuest) {
        cols.push(SCHEMAS.INVENTORY.CHECKED_OUT_BY_FIELD);
    }
    if (!isFreezerManagementEnabled(moduleContext)) {
        cols = cols.concat(SCHEMAS.INVENTORY.INVENTORY_COLS);
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

export function getSampleStatusType(row: any): SampleStateType {
    return (
        caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_TYPE_COLUMN_NAME)?.value ||
        caseInsensitive(row, 'StatusType')?.value
    );
}

export function getSampleStatusColor(color: string, stateType: SampleStateType | string): string {
    if (color) return color.toUpperCase();

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

export function getSampleStatus(row: any): SampleStatus {
    let label;
    // Issue 45269. If the state columns are present, don't look at a column named 'Label'
    let field = caseInsensitive(row, SAMPLE_STATE_COLUMN_NAME);
    if (field) {
        label = field.displayValue;
    } else {
        field = caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_COLUMN_NAME);
        if (field) {
            label = field.displayValue;
        } else {
            label = caseInsensitive(row, 'Label')?.value;
        }
    }
    return {
        label,
        statusType: getSampleStatusType(row),
        color:
            caseInsensitive(row, SAMPLE_STATE_COLOR_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_COLOR_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'Color')?.value,
        description:
            caseInsensitive(row, SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'SampleID/' + SAMPLE_STATE_DESCRIPTION_COLUMN_NAME)?.value ||
            caseInsensitive(row, 'Description')?.value,
    };
}

export function getFilterForSampleOperation(
    operation: SampleOperation,
    allowed = true,
    moduleContext?: ModuleContext
): Filter.IFilter {
    if (!isSampleStatusEnabled(moduleContext)) {
        return null;
    }

    const typesNotAllowed = [];
    for (const stateType in SampleStateType) {
        if (!permittedOps[stateType].has(operation)) {
            typesNotAllowed.push(stateType);
        }
    }
    if (typesNotAllowed.length === 0) {
        return null;
    }

    const filterType = allowed ? Filter.Types.NOT_IN : Filter.Types.IN;
    return Filter.create(SAMPLE_STATE_TYPE_COLUMN_NAME, typesNotAllowed, filterType);
}

function getOperationMessageAndRecommendation(operation: SampleOperation, numSamples: number, isAll?: boolean): string {
    if (isAll) {
        return operationRestrictionMessage[operation].all;
    } else {
        const messageInfo = operationRestrictionMessage[operation];
        let message;
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

export function getOperationNotPermittedMessageFromCounts(
    operation: SampleOperation,
    totalCount: number,
    notAllowedCount: number
): string {
    let notAllowedMsg: string = null;
    if (totalCount === 0) {
        return null;
    }
    if (notAllowedCount === totalCount) {
        return `All selected samples have a status that prevents ${operationRestrictionMessage[operation].all}.`;
    }
    if (notAllowedCount > 0) {
        notAllowedMsg = `The current status of ${notAllowedCount.toLocaleString()} selected sample${
            notAllowedCount === 1 ? '' : 's'
        } prevents ${getOperationMessageAndRecommendation(operation, notAllowedCount, false)}.`;
    }
    return notAllowedMsg;
}

export function getOperationNotPermittedMessage(
    operation: SampleOperation,
    statusData: OperationConfirmationData,
    aliquotIds?: number[]
): string {
    if (statusData) {
        const noAliquots = !aliquotIds || aliquotIds.length === 0;
        let notAllowed = [];
        // no aliquots or only aliquots, we show a status message about all that are not allowed
        if (noAliquots || aliquotIds.length === statusData.totalCount) {
            notAllowed = statusData.notAllowed;
        } else {
            // some aliquots, some not, filter out the aliquots from the status message
            notAllowed = statusData.notAllowed.filter(data => aliquotIds.indexOf(caseInsensitive(data, 'rowId')) < 0);
        }
        return getOperationNotPermittedMessageFromCounts(operation, statusData.totalCount, notAllowed.length);
    }
    return null;
}

export enum SamplesEditButtonSections {
    DELETE = 'delete',
    EDIT = 'edit',
    EDIT_PARENT = 'editparent',
    FIND_DERIVATIVES = 'findderivatives',
    IMPORT = 'import',
    LINK_TO_STUDY = 'linktostudy',
    MOVE_TO_PROJECT = 'movetoproject',
}

export function isSamplesSchema(schemaQuery: SchemaQuery): boolean {
    const lcSchemaName = schemaQuery?.schemaName?.toLowerCase();
    if (lcSchemaName === SCHEMAS.SAMPLE_SETS.SCHEMA) return true;

    return isAllSamplesSchema(schemaQuery);
}

export function isAllSamplesSchema(schemaQuery: SchemaQuery): boolean {
    const lcSchemaName = schemaQuery?.schemaName?.toLowerCase();
    const lcQueryName = schemaQuery?.queryName?.toLowerCase();
    if (
        lcSchemaName === SCHEMAS.EXP_TABLES.SCHEMA &&
        lcQueryName === SCHEMAS.EXP_TABLES.MATERIALS.queryName.toLowerCase()
    )
        return true;

    if (lcSchemaName === SCHEMAS.SAMPLE_MANAGEMENT.SCHEMA) {
        return (
            lcQueryName === SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES.queryName.toLowerCase() ||
            lcQueryName === SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ.queryName.toLowerCase()
        );
    }

    return false;
}

export function getURLParamsForSampleSelectionKey(
    model: QueryModel,
    picklistName?: string,
    isAssay?: boolean,
    sampleFieldKey?: string,
    ignoreFilter?: boolean
): Record<string, any> {
    const { keyValue, queryInfo, selectionKey } = model;
    let params = {};

    if (queryInfo) {
        const singleSelect = keyValue !== undefined;
        const { schemaQuery } = queryInfo;
        params['selectionKey'] = singleSelect
            ? SchemaQuery.createAppSelectionKey(schemaQuery, [keyValue])
            : selectionKey;

        if (!ignoreFilter) {
            model.filters.forEach(filter => {
                const filterURLSuffix = filter.getFilterType().getURLSuffix();
                // We don't need the picklist IN clause here since we're dealing with the samples selected in the grid
                const isPicklistFilterType = filterURLSuffix === PICKLIST_SAMPLES_FILTER.getURLSuffix();
                // and we don't need the LSID LineageOf clause either
                const isLineageOfFilterType = filterURLSuffix === Filter.Types.EXP_LINEAGE_OF.getURLSuffix();

                if (!isPicklistFilterType && !isLineageOfFilterType) {
                    params[filter.getURLParameterName()] = filter.getURLParameterValue();
                }
            });
        }

        if (picklistName) {
            params['picklistName'] = picklistName;
        }

        if (isAssay && sampleFieldKey) {
            params = { ...params, ...{ assayProtocol: schemaQuery.schemaName, isAssay: true, sampleFieldKey } };
        }
    }

    return params;
}

export function getSampleDomainDefaultSystemFields(moduleContext?: ModuleContext): SystemField[] {
    return isFreezerManagementEnabled(moduleContext)
        ? SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS.concat(SAMPLE_DOMAIN_INVENTORY_SYSTEM_FIELDS)
        : SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS;
}

export function getSampleStatusLockedMessage(state: SampleState, saving: boolean): string {
    const msgs = [];
    if (state?.inUse || saving) msgs.push('cannot change status type or be deleted because it is in use');
    if (state && !state.isLocal)
        msgs.push('can be changed only in the ' + state.containerPath.substring(1) + ' project');
    if (msgs.length > 0) return 'This sample status ' + msgs.join(' and ') + '.';
    return undefined;
}

export function getSampleStatusContainerFilter(
    forLegend?: boolean,
    containerPath?: string,
    moduleContext?: ModuleContext
): Query.ContainerFilter {
    // Check to see if product projects support is enabled.
    if (!isProductProjectsEnabled(moduleContext)) {
        return undefined;
    }

    // The legend should show statuses for all the samples that can be seen in the project.
    if (forLegend && isProjectContainer(containerPath)) {
        return Query.ContainerFilter.currentAndSubfoldersPlusShared;
    }

    // When requesting data from a sub-folder context the ContainerFilter filters
    // "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}
