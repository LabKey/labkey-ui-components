import React, { ReactNode } from 'react';
import { List, OrderedMap, Set } from 'immutable';
import { ActionURL, Utils } from '@labkey/api';

import {
    getOperationNotPermittedMessage,
    isSampleOperationPermitted,
    SamplesEditButtonSections,
} from '../internal/components/samples/utils';
import { MenuItemModel, ProductMenuModel } from '../internal/components/navigation/model';
import { SAMPLES_KEY } from '../internal/app/constants';
import { AppURL, createProductUrlFromParts } from '../internal/url/AppURL';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import {
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SampleOperation,
} from '../internal/components/samples/constants';
import { ModuleContext } from '../internal/components/base/ServerContext';
import { EntityChoice, OperationConfirmationData } from '../internal/components/entities/models';
import { caseInsensitive, parseCsvString } from '../internal/util/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { getPrimaryAppProperties, isELNEnabled } from '../internal/app/utils';
import { QueryInfo } from '../public/QueryInfo';
import { naturalSort, naturalSortByProperty } from '../public/sort';
import { DELIMITER } from '../internal/components/forms/constants';
import { AssayStateModel } from '../internal/components/assay/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { AssayUploadTabs } from '../internal/constants';

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

// TODO: Convert this into a component and utilize useServerContext() to fetch moduleContext for isELNEnabled() check
export function getSampleDeleteMessage(canDelete: boolean, deleteInfoError: boolean): ReactNode {
    let deleteMsg;
    if (canDelete === undefined) {
        deleteMsg = <LoadingSpinner msg="Loading delete confirmation data..." />;
    } else if (!canDelete) {
        deleteMsg = 'This sample cannot be deleted because ';
        if (deleteInfoError) {
            deleteMsg += 'there was a problem loading the delete confirmation data.';
        } else {
            deleteMsg += 'it has either derived sample, job, or assay data dependencies, ';
            if (isELNEnabled()) {
                deleteMsg += 'status that prevents deletion, or references in one or more active notebooks';
            } else {
                deleteMsg += 'or status that prevents deletion';
            }
            deleteMsg += '. Check the Lineage, Assays, and Jobs tabs for this sample to get more information.';
        }
    }
    return deleteMsg;
}

export const getSampleTypeTemplateUrl = (
    queryInfo: QueryInfo,
    importAliases: Record<string, string>,
    excludeColumns: string[] = ['flag', 'Ancestors'],
    exportConfig: any = SAMPLE_EXPORT_CONFIG
): string => {
    const { schemaQuery } = queryInfo;
    if (!schemaQuery) return undefined;

    const extraColumns = SAMPLE_INSERT_EXTRA_COLUMNS.concat(Object.keys(importAliases || {})).filter(
        col => excludeColumns.indexOf(col) == -1
    );

    return ActionURL.buildURL('query', 'ExportExcelTemplate', null, {
        ...exportConfig,
        schemaName: schemaQuery.getSchema(),
        'query.queryName': schemaQuery.getQuery(),
        headerType: 'DisplayFieldKey',
        excludeColumn: excludeColumns
            ? excludeColumns.concat(queryInfo.getFileColumnFieldKeys())
            : queryInfo.getFileColumnFieldKeys(),
        includeColumn: extraColumns,
    });
};

export function createEntityParentKey(schemaQuery: SchemaQuery, id?: string): string {
    const keys = [schemaQuery.schemaName, schemaQuery.queryName];
    if (id) {
        keys.push(id);
    }
    return keys.join(':').toLowerCase();
}

export function parentValuesDiffer(
    sortedOriginalParents: List<EntityChoice>,
    currentParents: List<EntityChoice>
): boolean {
    const sortedCurrentParents = currentParents
        .sortBy(choice => (choice.type ? choice.type.label : '~~NO_TYPE~~'), naturalSort)
        .toList();
    const difference = sortedOriginalParents.find((original, index) => {
        const current = sortedCurrentParents.get(index);
        if (!current) return true;
        if (current.type && original.type.rowId !== current.type.rowId) {
            return true;
        }
        const originalValues = original.value
            ? parseCsvString(original.value, DELIMITER).sort(naturalSort).join(DELIMITER)
            : '';
        const currentValues = current.value
            ? parseCsvString(current.value, DELIMITER).sort(naturalSort).join(DELIMITER)
            : '';
        if (originalValues !== currentValues) {
            return true;
        }
    });
    if (difference) {
        return true;
    }
    // we have more current parents than the original and we have selected a value for at least one of these parents.
    if (sortedCurrentParents.size > sortedOriginalParents.size) {
        return (
            sortedCurrentParents.slice(sortedOriginalParents.size).find(parent => parent.value !== undefined) !==
            undefined
        );
    }
    return false;
}

export function getUpdatedRowForParentChanges(
    originalParents: List<EntityChoice>,
    currentParents: List<EntityChoice>,
    childData: Record<string, any>,
    childQueryInfo?: QueryInfo
): Record<string, any> {
    const definedCurrentParents = currentParents
        .filter(parent => parent.type !== null && parent.type !== undefined)
        .toList();
    const updatedValues = {};
    if (definedCurrentParents.isEmpty()) {
        // have no current parents but have original parents, send in empty strings so original parents are removed.
        originalParents?.forEach(parentChoice => {
            updatedValues[parentChoice.type.entityDataType.insertColumnNamePrefix + parentChoice.type.label] = null;
        });
    } else {
        let definedParents = Set<string>();
        definedCurrentParents.forEach(parentChoice => {
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentChoice.type.entityDataType.insertColumnNamePrefix + parentChoice.type.label] =
                parentChoice.value || null;
            definedParents = definedParents.add(parentChoice.type.label);
        });
        // Issue 40194: for any original parents that have been removed, send null values so they will actually be removed
        originalParents?.forEach(parent => {
            if (!definedParents.contains(parent.type.label)) {
                updatedValues[parent.type.entityDataType.insertColumnNamePrefix + parent.type.label] = null;
            }
        });
    }

    childQueryInfo?.getPkCols().forEach(pkCol => {
        const pkVal = childData[pkCol.fieldKey]?.['value'];

        if (pkVal !== undefined && pkVal !== null) {
            updatedValues[pkCol.fieldKey] = pkVal;
        } else {
            console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
        }
    });
    return updatedValues;
}

export function getUpdatedLineageRowsForBulkEdit(
    nonAliquots: Record<string, any>,
    selectedParents: List<EntityChoice>,
    originalParents: Record<string, List<EntityChoice>>,
    queryInfo: QueryInfo
): any[] {
    const rows = [];
    Object.keys(nonAliquots).forEach(rowId => {
        const updatedValues = {};
        let haveUpdate = false;

        // Find the types that are included and use those for change comparison.
        // Types that are not represented in the selected parents won't be changed.
        selectedParents.forEach(selected => {
            if (selected.type) {
                let originalValue = null;
                const possibleChange = originalParents[rowId].find(p => p.type.lsid == selected.type.lsid);
                if (possibleChange) {
                    originalValue = possibleChange.gridValues
                        .map(gridValue => gridValue.displayValue)
                        .sort(naturalSort)
                        .join(',');
                }
                const selValue = selected.value
                    ? parseCsvString(selected.value, ',', false).sort(naturalSort).join(',')
                    : null;
                if (originalValue !== selValue) {
                    updatedValues[selected.type.entityDataType.insertColumnNamePrefix + selected.type.label] = selValue;
                    haveUpdate = true;
                }
            }
        });
        if (haveUpdate) {
            queryInfo.getPkCols().forEach(pkCol => {
                const pkVal = caseInsensitive(nonAliquots[rowId], pkCol.fieldKey)?.['value'];

                if (pkVal !== undefined && pkVal !== null) {
                    updatedValues[pkCol.fieldKey] = pkVal;
                } else {
                    console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                }
            });
            rows.push(updatedValues);
        }
    });
    return rows;
}

export function getSampleFinderLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + '-SampleFinder';
}

export function getImportItemsForAssayDefinitions(
    assayStateModel: AssayStateModel,
    sampleModel?: QueryModel,
    providerType?: string,
    isPicklist?: boolean,
    currentProductId?: string,
    targetProductId?: string,
    ignoreFilter?: boolean
): OrderedMap<AssayDefinitionModel, string> {
    let targetSQ;
    const selectionKey = sampleModel?.id;

    if (sampleModel?.queryInfo) {
        targetSQ = sampleModel.queryInfo.schemaQuery;
    }

    return assayStateModel.definitions
        .filter(assay => providerType === undefined || assay.type === providerType)
        .filter(assay => !targetSQ || assay.hasLookup(targetSQ, isPicklist))
        .sort(naturalSortByProperty('name'))
        .reduce((items, assay) => {
            const href = assay.getImportUrl(
                selectionKey ? AssayUploadTabs.Grid : AssayUploadTabs.Files,
                selectionKey,
                // Check for the existence of the "queryInfo" before getting filters from the model.
                // This avoids `QueryModel` throwing an error when the "queryInfo" is not yet available.
                sampleModel?.queryInfo ? List(sampleModel.filters) : undefined,
                isPicklist,
                currentProductId,
                targetProductId,
                ignoreFilter
            );
            return items.set(assay, href);
        }, OrderedMap<AssayDefinitionModel, string>());
}
