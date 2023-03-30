import { fromJS, List, Map, OrderedMap } from 'immutable';
import { Query } from '@labkey/api';

import {
    invalidateQueryDetailsCache,
    ISelectRowsResult,
    loadQueriesFromTable,
    selectRowsDeprecated,
} from '../internal/query/api';
import { SCHEMAS } from '../internal/schemas';
import { resolveErrorMessage } from '../internal/util/messaging';
import {
    EntityChoice,
    EntityDataType,
    IEntityTypeOption,
    IParentAlias,
    IParentOption,
} from '../internal/components/entities/models';
import { getParentTypeDataForLineage } from '../internal/components/samples/actions';
import { getInitialParentChoices } from '../internal/components/entities/utils';
import { QueryInfo } from '../public/QueryInfo';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { SchemaQuery } from '../public/SchemaQuery';

import { URLService } from '../internal/url/URLResolver';
import { DATA_CLASS_KEY, SAMPLE_TYPE_KEY } from '../internal/app/constants';

import { naturalSortByProperty } from '../public/sort';
import { generateId } from '../internal/util/utils';

import { filterMediaSampleTypes } from './utils';
import { DATA_CLASS_IMPORT_PREFIX, SAMPLE_SET_IMPORT_PREFIX } from './constants';

// TODO: this file is temporary as we move things into an @labkey/components/entities subpackage. Instead of adding
// anything to this file, we should create an API wrapper to be used for any new actions in this subpackage.

export function getSampleTypes(includeMedia?: boolean): Promise<Array<{ id: number; label: string }>> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            sort: 'Name',
            filterArray: filterMediaSampleTypes(includeMedia),
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
            .then(response => {
                const { key, models, orderedModels } = response;
                const sampleTypeOptions = [];
                orderedModels[key].forEach(row => {
                    const data = models[key][row];
                    sampleTypeOptions.push({ id: data.RowId.value, label: data.Name.value });
                });
                resolve(sampleTypeOptions);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export const getOriginalParentsFromLineage = async (
    lineage: Record<string, any>,
    parentDataTypes: EntityDataType[],
    containerPath?: string
): Promise<{
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}> => {
    const originalParents = {};
    let parentTypeOptions = Map<string, List<IEntityTypeOption>>();
    const dataClassTypeData = await getParentTypeDataForLineage(
        parentDataTypes.filter(
            dataType => dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
        )[0],
        Object.values(lineage),
        containerPath
    );
    const sampleTypeData = await getParentTypeDataForLineage(
        parentDataTypes.filter(
            dataType => dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName
        )[0],
        Object.values(lineage),
        containerPath
    );

    // iterate through both Data Classes and Sample Types for finding sample parents
    parentDataTypes.forEach(dataType => {
        const dataTypeOptions =
            dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
                ? dataClassTypeData.parentTypeOptions
                : sampleTypeData.parentTypeOptions;

        const parentIdData =
            dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
                ? dataClassTypeData.parentIdData
                : sampleTypeData.parentIdData;
        Object.keys(lineage).forEach(sampleId => {
            if (!originalParents[sampleId]) originalParents[sampleId] = List<EntityChoice>();

            originalParents[sampleId] = originalParents[sampleId].concat(
                getInitialParentChoices(dataTypeOptions, dataType, lineage[sampleId], parentIdData)
            );
        });

        // filter out the current parent types from the dataTypeOptions
        const originalParentTypeLsids = [];
        Object.values(originalParents).forEach((parentTypes: List<EntityChoice>) => {
            originalParentTypeLsids.push(...parentTypes.map(parentType => parentType.type.lsid).toArray());
        });
        parentTypeOptions = parentTypeOptions.set(
            dataType.typeListingSchemaQuery.queryName,
            dataTypeOptions.filter(option => originalParentTypeLsids.indexOf(option.lsid) === -1).toList()
        );
    });

    return { originalParents, parentTypeOptions };
};

export const loadSampleTypes = (includeMedia: boolean): Promise<QueryInfo[]> =>
    loadQueriesFromTable(
        SCHEMAS.EXP_TABLES.SAMPLE_SETS,
        'Name',
        SCHEMAS.SAMPLE_SETS.SCHEMA,
        Query.containerFilter.currentPlusProjectAndShared,
        filterMediaSampleTypes(includeMedia)
    );

export function onSampleChange(): void {
    invalidateLineageResults();
}

export function onSampleTypeChange(schemaQuery: SchemaQuery, containerPath: string): void {
    invalidateQueryDetailsCache(schemaQuery, containerPath);
    invalidateLineageResults();
}

export function onSampleTypeRename(): void {
    URLService.clearCache(SAMPLE_TYPE_KEY);
}

export function onDataClassRename(): void {
    URLService.clearCache(DATA_CLASS_KEY);
}

export function initParentOptionsSelects(
    includeSampleTypes: boolean,
    includeDataClasses: boolean,
    containerPath: string,
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean,
    newTypeOption?: any,
    importAliases?: Map<string, string>,
    idPrefix?: string,
    formatLabel?: (name: string, prefix: string, isDataClass?: boolean, containerPath?: string) => string
): Promise<{
    parentAliases: Map<string, IParentAlias>;
    parentOptions: IParentOption[];
}> {
    const promises: Array<Promise<ISelectRowsResult>> = [];

    // Get Sample Types
    if (includeSampleTypes) {
        promises.push(
            selectRowsDeprecated({
                containerPath,
                schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
                queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
                columns: 'LSID, Name, RowId, Folder',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    // Get Data Classes
    if (includeDataClasses) {
        promises.push(
            selectRowsDeprecated({
                containerPath,
                schemaName: SCHEMAS.EXP_TABLES.DATA_CLASSES.schemaName,
                queryName: SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName,
                columns: 'LSID, Name, RowId, Folder, Category',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    return new Promise((resolve, reject) => {
        Promise.all(promises)
            .then(responses => {
                const sets: IParentOption[] = [];
                responses.forEach(result => {
                    const domain = fromJS(result.models[result.key]);

                    const isDataClass = result.key === 'exp/dataclasses';

                    const prefix = isDataClass ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
                    const labelPrefix = isDataClass ? 'Data Class' : 'Sample Type';

                    domain.forEach(row => {
                        if (isValidParentOptionFn) {
                            if (!isValidParentOptionFn(row, isDataClass)) return;
                        }
                        const name = row.getIn(['Name', 'value']);
                        const containerPath = row.getIn(['Folder', 'displayValue']);
                        const label = formatLabel ? formatLabel(name, labelPrefix, isDataClass, containerPath) : name;
                        sets.push({
                            value: prefix + name,
                            label,
                            schema: isDataClass ? SCHEMAS.DATA_CLASSES.SCHEMA : SCHEMAS.SAMPLE_SETS.SCHEMA,
                            query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                        });
                    });

                    if (newTypeOption) {
                        if (
                            (!isDataClass && newTypeOption.schema === SCHEMAS.SAMPLE_SETS.SCHEMA) ||
                            (isDataClass && newTypeOption.schema !== SCHEMAS.SAMPLE_SETS.SCHEMA)
                        )
                            sets.push(newTypeOption);
                    }
                });

                const parentOptions = sets.sort(naturalSortByProperty('label'));

                let parentAliases = Map<string, IParentAlias>();

                if (importAliases) {
                    const initialAlias = Map<string, string>(importAliases);
                    initialAlias.forEach((val, key) => {
                        const newId = generateId(idPrefix);
                        const parentValue = parentOptions.find(opt => opt.value === val);
                        if (!parentValue)
                            // parent option might have been filtered out by isValidParentOptionFn
                            return;

                        parentAliases = parentAliases.set(newId, {
                            id: newId,
                            alias: key,
                            parentValue,
                            ignoreAliasError: false,
                            ignoreSelectError: false,
                        } as IParentAlias);
                    });
                }
                resolve({
                    parentOptions,
                    parentAliases,
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}
