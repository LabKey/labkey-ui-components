import {Utils} from "@labkey/api";

import {
    getOperationNotPermittedMessage,
    isSampleOperationPermitted,
    SamplesEditButtonSections
} from '../internal/components/samples/utils';
import {MenuItemModel, ProductMenuModel} from "../internal/components/navigation/model";
import {SAMPLES_KEY} from "../internal/app/constants";
import {AppURL, createProductUrlFromParts} from "../internal/url/AppURL";
import {SchemaQuery} from "../public/SchemaQuery";
import {SCHEMAS} from "../internal/schemas";
import {SAMPLE_STATE_TYPE_COLUMN_NAME, SampleOperation} from "../internal/components/samples/constants";
import {ModuleContext} from "../internal/components/base/ServerContext";
import {OperationConfirmationData} from "../internal/components/entities/models";
import {caseInsensitive} from "../internal/util/utils";

export function getCrossFolderSelectionMsg(
    crossFolderSelectionCount: number,
    currentFolderSelectionCount: number,
    noun: string,
    nounPlural: string
): string {
    let first = '';
    if (!crossFolderSelectionCount) return undefined;
    if (currentFolderSelectionCount === 0) {
        if (crossFolderSelectionCount === 1) first = `The ${noun} you selected does not `;
        else first = `The ${nounPlural} you selected don't `;
    } else first = `Some of the ${nounPlural} you selected don't `;
    first += 'belong to this project.';
    const second = ` Please select ${nounPlural} from only this project, or navigate to the appropriate project to work with them.`;
    return first + second;
}

export function filterSampleRowsForOperation(
    rows: Record<string, any>,
    operation: SampleOperation,
    sampleIdField = 'RowId',
    moduleContext?: ModuleContext
): { rows: { [p: string]: any }; statusData: OperationConfirmationData; statusMessage: string } {
    const allowed = [];
    const notAllowed = [];
    const validRows = {};
    Object.values(rows).forEach(row => {
        const statusType = caseInsensitive(row, SAMPLE_STATE_TYPE_COLUMN_NAME).value;
        const id = caseInsensitive(row, sampleIdField).value;
        const statusRecord = {
            RowId: caseInsensitive(row, sampleIdField).value,
            Name: caseInsensitive(row, 'SampleID').displayValue,
        };
        if (isSampleOperationPermitted(statusType, operation, moduleContext)) {
            allowed.push(statusRecord);
            validRows[id] = row;
        } else {
            notAllowed.push(statusRecord);
        }
    });
    const statusData = new OperationConfirmationData({ allowed, notAllowed });
    return {
        rows: validRows,
        statusMessage: getOperationNotPermittedMessage(operation, statusData),
        statusData,
    };
}

export const shouldIncludeMenuItem = (
    action: SamplesEditButtonSections,
    excludedMenuKeys: SamplesEditButtonSections[]
): boolean => {
    return excludedMenuKeys === undefined || excludedMenuKeys.indexOf(action) === -1;
};

export function getSampleSetMenuItem(menu: ProductMenuModel, key: string): MenuItemModel {
    const sampleSetsSection = menu ? menu.getSection(SAMPLES_KEY) : undefined;
    return sampleSetsSection
        ? sampleSetsSection.items.find(set => Utils.caseInsensitiveEquals(set.get('key'), key))
        : undefined;
}

export function isFindByIdsSchema(schemaQuery: SchemaQuery): boolean {
    const lcSchemaName = schemaQuery?.schemaName?.toLowerCase();
    const lcQueryName = schemaQuery?.queryName?.toLowerCase();
    return lcSchemaName === SCHEMAS.EXP_TABLES.SCHEMA && lcQueryName.startsWith('exp_temp_');
}

/**
 * Provides sample wizard URL for this application.
 * @param targetSampleSet - Intended sample type of newly created samples.
 * @param parent - Intended parent of derived samples. Format SCHEMA:QUERY:ID
 * @param selectionKey
 * @param currentProductId
 * @param targetProductId
 */
export function getSampleWizardURL(
    targetSampleSet?: string,
    parent?: string,
    selectionKey?: string,
    currentProductId?: string,
    targetProductId?: string
): string | AppURL {
    const params = {};

    if (targetSampleSet) {
        params['target'] = targetSampleSet;
    }

    if (parent) {
        params['parent'] = parent;
    }

    if (selectionKey) params['selectionKey'] = selectionKey;

    return createProductUrlFromParts(targetProductId, currentProductId, params, SAMPLES_KEY, 'new');
}
