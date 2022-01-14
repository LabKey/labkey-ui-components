import { Map } from 'immutable';
import { Ajax, Filter, Query, Utils } from '@labkey/api';

import {
    buildURL,
    getContainerFilter,
    getOmittedSampleTypeColumns,
    invalidateQueryDetailsCache,
    QueryConfig,
    QueryModel,
    resolveErrorMessage,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SchemaQuery,
    SCHEMAS,
    URLResolver
} from '../../..';
import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { SearchIdData, SearchResultCardData } from './models';
import { FilterCardProps } from './FilterCards';
import { getFilterCardColumnName } from './utils';
import { User } from '../base/models/User';

export function searchUsingIndex(
    userConfig,
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData,
    filterCategories?: string[]
): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api'),
            method: 'GET',
            params: userConfig,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                const urlResolver = new URLResolver();
                urlResolver.resolveSearchUsingIndex(json).then(results => {
                    resolve({
                        ...results,
                        hits: getProcessedSearchHits(results['hits'], getCardDataFn, filterCategories),
                    });
                });
            }),
            failure: Utils.getCallbackWrapper(
                json => {
                    reject(json);
                },
                null,
                false
            ),
        });
    });
}

// Some search results will not have a data object.  Much of the display logic
// relies on this, so for such results that we want to show the user, we add a
// data element
function addDataObjects(jsonResults) {
    jsonResults.hits.forEach(hit => {
        if (hit.data === undefined || !hit.data.id) {
            const data = parseSearchIdToData(hit.id);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0) {
                if (!hit.data) hit.data = data;
                else hit.data = { ...data, ...hit.data };
            }
        }
    });
}

// Create a data object from the search id, which is assumed to be of the form:
//      [group:][type:]rowId
function parseSearchIdToData(idString): SearchIdData {
    const idData = new SearchIdData();
    if (idString) {
        const idParts = idString.split(':');

        idData.id = idParts[idParts.length - 1];
        if (idParts.length > 1) idData.type = idParts[idParts.length - 2];
        if (idParts.length > 2) idData.group = idParts[idParts.length - 3];
    }
    return idData;
}

function resolveTypeName(data: any) {
    let typeName;
    if (data) {
        if (data.dataClass?.name) {
            typeName = data.dataClass.name;
        } else if (data.sampleSet?.name) {
            typeName = data.sampleSet.name;
        }
    }
    return typeName;
}

function resolveIconSrc(data: any, category: string): string {
    let iconSrc = '';
    if (data) {
        if (data.dataClass?.name) {
            iconSrc = data.dataClass.name.toLowerCase();
        } else if (data.sampleSet?.name) {
            iconSrc = 'samples';
        } else if (data.type) {
            const lcType = data.type.toLowerCase();
            if (lcType === 'sampleset') {
                iconSrc = 'sample_set';
            } else if (lcType.indexOf('dataclass') === 0) {
                iconSrc = 'default'; // we don't have a generic "data class" icon; default works just fine.
            } else {
                iconSrc = lcType;
            }
        }
    }
    if (!iconSrc && category) {
        if (category === 'material') {
            iconSrc = 'samples';
        }
    }
    return iconSrc;
}

export function getSearchResultCardData(data: any, category: string, title: string): SearchResultCardData {
    return {
        title,
        iconSrc: resolveIconSrc(data, category),
        typeName: resolveTypeName(data),
    };
}

function getCardData(
    category: string,
    data: any,
    title: string,
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData
): SearchResultCardData {
    let cardData = getSearchResultCardData(data, category, title);
    if (getCardDataFn) {
        cardData = { ...cardData, ...getCardDataFn(data, category) };
    }
    return cardData;
}

// TODO: add categories for other search results so the result['data'] check could be removed.
export function getProcessedSearchHits(
    results: any,
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData,
    filterCategories = ['data', 'material', 'workflowJob', 'file workflowJob']
): {} {
    return results
        ? results
              .filter(result => {
                  const category = result['category'];
                  return filterCategories?.indexOf(category) > -1 || result['data'];
              })
              .map(result => {
                  return {
                      ...result,
                      cardData: getCardData(result['category'], result['data'], result['title'], getCardDataFn),
                  };
              })
        : undefined;
}

export function getFinderSampleTypeNames(containerFilter: Query.ContainerFilter = undefined): Promise<string[]> {
    return new Promise((resolve, reject) => {
        Query.executeSql({
            // Retrieves all sample types for the given container filter, whether there are samples in them or not.
            sql: 'SELECT Name FROM SampleSets',
            containerFilter,
            sort: 'Name',
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.getSchema(),
            success: data => {
                resolve(data.rows.map(row => row['Name']));
            },
            failure: reason => {
                console.error("Problem retrieving filtered sample types", reason);
                reject("There was a problem retrieving the filtered sample types. " + resolveErrorMessage(reason));
            }
        });
    });
}

const SAMPLE_FINDER_VIEW_NAME = "~~Sample Finder~~";

export function removeFinderGridView(model: QueryModel): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (model.queryInfo?.views?.has(SAMPLE_FINDER_VIEW_NAME)) {
            Query.deleteQueryView({
                schemaName: model.schemaQuery.schemaName,
                queryName: model.schemaQuery.queryName,
                viewName: SAMPLE_FINDER_VIEW_NAME,
                revert: true,
                success: () => {
                    resolve(true);
                },
                failure: (error) => {
                    console.error("There was a problem deleting the session view.", error);
                    reject(resolveErrorMessage(error));
                }
            });
        }
        resolve(true); // nothing to delete, so we're very successful.
    });
}

export function saveFinderGridView(columns: any, schemaQuery: SchemaQuery): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const jsonData = {
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            views: [{ name: SAMPLE_FINDER_VIEW_NAME, columns }],
        };
        return Ajax.request({
            url: buildURL('query', 'saveQueryViews.api'),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper(response => {
                // since we have a new view, we need to reload queryDetails to bring in that view
                invalidateQueryDetailsCache(schemaQuery);
                console.log("Saved view ", schemaQuery.toJS(), columns, response);
                resolve(true);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(
                    'There was a problem creating the view for the data grid. ' + resolveErrorMessage(response)
                );
            }),
        });
    });
}

export function getSampleFinderQueryConfigs(user: User, cards: FilterCardProps[], filterChangeCounter: number): Promise<{[key: string]: QueryConfig}> {
    const omittedColumns = getOmittedSampleTypeColumns(user);
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        if (card.filterArray.length) {
            card.filterArray.forEach(filter => {
                requiredColumns.push(filter.getColumnName());
            });
            baseFilters.push(...card.filterArray);
        } else {
            const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery);

            requiredColumns.push(cardColumnName);
            baseFilters.push(Filter.create(cardColumnName + "/lsid$SName", null, Filter.Types.NONBLANK));
        }
    });
    const allSamplesKey = 'sampleFinder' + '-' + filterChangeCounter + '|exp/materials';
    const configs: { [key: string]: QueryConfig } = {
        [allSamplesKey]: {
            id: allSamplesKey,
            title: 'All Samples',
            schemaQuery: SchemaQuery.create(SCHEMAS.EXP_TABLES.MATERIALS.schemaName, SCHEMAS.EXP_TABLES.MATERIALS.queryName, SAMPLE_FINDER_VIEW_NAME),
            requiredColumns,
            omittedColumns: ['Run'],
            baseFilters,
        },
    };
    return new Promise(async (resolve, reject) => {
        try {
            const names = await getFinderSampleTypeNames(getContainerFilter());
            for (const name of names) {
                const id = 'sampleFinder' + '-' + filterChangeCounter + '|samples/' + name;
                const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, name, SAMPLE_FINDER_VIEW_NAME);
                configs[id] = {
                    id,
                    title: name,
                    schemaQuery,
                    requiredColumns,
                    omittedColumns,
                    baseFilters,
                };
            }
            resolve(configs);
        }
        catch (error) {
            reject(resolveErrorMessage(error))
        }
    });
}
