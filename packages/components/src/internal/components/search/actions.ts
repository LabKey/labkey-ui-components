import { Map } from 'immutable';
import { Ajax, Query, Utils } from '@labkey/api';

import { DataViewInfoTypes, RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { getPrimaryAppProperties, getProjectPath, isAllProductFoldersFilteringEnabled } from '../../app/utils';

import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { incrementClientSideMetricCount } from '../../actions';
import { buildURL } from '../../url/AppURL';
import { URLResolver } from '../../url/URLResolver';
import { resolveErrorMessage } from '../../util/messaging';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { loadReports } from '../../query/reports';
import { IDataViewInfo } from '../../DataViewInfo';
import { selectRows } from '../../query/selectRows';
import { caseInsensitive, handleRequestFailure } from '../../util/utils';

import { getContainerFilter, getQueryDetails, invalidateQueryDetailsCache } from '../../query/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { EXP_TABLES, SCHEMAS } from '../../schemas';

import { ModuleContext } from '../base/ServerContext';

import {
    getFinderViewColumnsConfig,
    getSampleFinderTabRowCountSql,
    getSearchScopeFromContainerFilter,
    SAMPLE_FINDER_VIEW_NAME,
} from './utils';
import { FinderReport, SearchIdData, SearchResultCardData } from './models';
import { SearchCategory, SearchField, SearchScope } from './constants';

export type GetCardDataFn = (data: Map<any, any>, category?: string) => SearchResultCardData;

export interface SearchHit {
    category?: SearchCategory;
    container: string;
    data?: any;
    id: string;
    identifiers?: string;
    score?: number;
    summary?: string;
    title: string;
    url?: string;
}

export interface SearchMetadata {
    idProperty: string;
    root: string;
    successProperty: string;
}

export interface SearchResult {
    hits: SearchHit[];
    metaData: SearchMetadata;
    q: string;
    success: boolean;
    totalHits: number;
}

export interface SearchOptions {
    category?: SearchCategory | SearchCategory[];
    containerPath?: string;
    experimentalCustomJson?: boolean;
    fields?: SearchField[];
    limit?: number;
    normalizeUrls?: boolean;
    offset?: number;
    q: string;
    requestHandler?: (request: XMLHttpRequest) => void;
    scope?: SearchScope;
}

export type Search = (
    options: SearchOptions,
    moduleContext?: ModuleContext,
    applyURLResolver?: boolean,
    request?: (config: Ajax.RequestOptions) => XMLHttpRequest
) => Promise<SearchResult>;

export const search: Search = (options, moduleContext, applyURLResolver = true, request = Ajax.request) => {
    // eslint-disable-next-line prefer-const
    let { containerPath, requestHandler, ...params } = options;

    let containerPath_: string;
    if (isAllProductFoldersFilteringEnabled(moduleContext)) {
        containerPath_ = getProjectPath();
        params.scope = SearchScope.FolderAndSubfoldersAndShared;
    } else if (containerPath) {
        containerPath_ = containerPath;
    }

    // Return extra info about entity types and material results
    if (params.experimentalCustomJson === undefined) {
        params.experimentalCustomJson = true;
    }

    // Remove the containerID from the returned URL
    if (params.normalizeUrls === undefined) {
        params.normalizeUrls = true;
    }

    if (!params.scope) {
        params.scope = getSearchScopeFromContainerFilter(getContainerFilter(containerPath_));
    }

    if (Array.isArray(params.category)) {
        (params as any).category = params.category.join('+');
    }

    return new Promise((resolve, reject) => {
        const request_ = request({
            url: buildURL('search', 'json.api', undefined, {
                container: containerPath_,
            }),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper(json => {
                if (applyURLResolver) {
                    resolve(new URLResolver().resolveSearchUsingIndex(json));
                } else {
                    resolve(json);
                }
            }),
            failure: handleRequestFailure(reject, 'Failed search query'),
        });
        requestHandler?.(request_);
    });
};

export interface SearchHitWithCardData extends SearchHit {
    cardData: SearchResultCardData;
}

export interface SearchResultWithCardData extends Omit<SearchResult, 'hits'> {
    hits: SearchHitWithCardData[];
}

/** @deprecated Use search() instead */
export async function searchUsingIndex(
    options: SearchOptions,
    getCardDataFn?: GetCardDataFn
): Promise<SearchResultWithCardData> {
    const appProps = getPrimaryAppProperties();
    if (appProps?.productId) {
        incrementClientSideMetricCount(appProps.productId + 'Search', 'count');
    }

    // Don't apply the URL Resolver until the data objects have been resolved
    let result = await search(options, undefined, false);
    addDataObjects(result);
    result = new URLResolver().resolveSearchUsingIndex(result);

    return { ...result, hits: getProcessedSearchHits(result.hits, getCardDataFn) };
}

// Some search results will not have a data object.  Much of the display logic
// relies on this, so for such results that we want to show the user, we add a
// data element
function addDataObjects(result: SearchResult): void {
    result.hits.forEach(hit => {
        if (hit.data === undefined || !hit.data.id) {
            const data = parseSearchHitToData(hit);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0) {
                if (!hit.data) hit.data = data;
                else hit.data = { ...data, ...hit.data };
            }
        }
    });
}

// Create a data object from the search id, which is assumed to be of the form:
//      [group:][type:]rowId
function parseSearchHitToData(hit: SearchHit): SearchIdData {
    const idData = new SearchIdData();
    if (hit.id) {
        const idParts = hit.id.split(':');

        idData.id = idParts[idParts.length - 1];
        if (idParts.length > 1) idData.type = idParts[idParts.length - 2];
        if (idParts.length > 2) idData.group = idParts[idParts.length - 3];
    }
    return idData;
}

// exported for jest testing
export function resolveTypeName(data: any, category: string): string {
    let typeName;
    if (data) {
        if (data.dataClass?.name) {
            typeName = data.dataClass.name;
        } else if (data.sampleSet?.name) {
            typeName = data.sampleSet.name;
        }
    }
    if (!typeName && category) {
        if (category === 'notebook') {
            typeName = 'Notebook';
        } else if (category === 'notebookTemplate') {
            typeName = 'Notebook Template';
        }
    }
    return typeName;
}

// exported for jest testing
export function resolveIconSrc(data: any, category: string): string {
    let iconSrc: string;
    if (data) {
        if (data.dataClass?.name) {
            // Issue 44917: Resolve search icon for uncategorized data classes
            if (data.dataClass.category) {
                iconSrc = data.dataClass.name.toLowerCase();
            }
            // else fallback to default
        } else if (data.sampleSet?.name) {
            iconSrc = 'samples';
        } else if (data.type) {
            const lcType = data.type.toLowerCase();
            if (lcType === 'sampleset') {
                iconSrc = 'sample_set';
            } else if (lcType.indexOf('dataclass') !== 0) {
                iconSrc = lcType;
            }
            // else fallback to default
        }
    }
    if (!iconSrc && category) {
        if (category === 'material') {
            iconSrc = 'samples';
        }
        if (category === 'workflowJob') {
            iconSrc = 'workflow';
        }
        if (category === 'notebook' || category === 'notebookTemplate') {
            iconSrc = 'notebook_blue';
        }
    }
    return iconSrc;
}

// exported for jest testing
export function resolveIconDir(category: string): string {
    let iconDir;
    if (category) {
        if (category === 'notebook' || category === 'notebookTemplate') {
            iconDir = 'labbook/images';
        }
    }
    return iconDir;
}

export function getSearchResultCardData(data: any, category: string, title: string): SearchResultCardData {
    return {
        title,
        iconDir: resolveIconDir(category),
        iconSrc: resolveIconSrc(data, category),
        typeName: resolveTypeName(data, category),
    };
}

function getCardData(category: string, data: any, title: string, getCardDataFn?: GetCardDataFn): SearchResultCardData {
    const cardData = getSearchResultCardData(data, category, title);
    if (getCardDataFn) {
        return { ...cardData, ...getCardDataFn(data, category) };
    }
    return cardData;
}

export function getProcessedSearchHits(hits: SearchHit[], getCardDataFn?: GetCardDataFn): SearchHitWithCardData[] {
    if (!hits) return [];

    return hits.map(hit => ({
        ...hit,
        cardData: getCardData(hit.category, hit.data, hit.title, getCardDataFn),
    }));
}

export function saveFinderGridView(
    schemaQuery: SchemaQuery,
    columnDisplayNames: { [key: string]: string },
    requiredColumns?: string[]
): Promise<SchemaQuery> {
    return new Promise((resolve, reject) => {
        getQueryDetails({
            queryName: schemaQuery.queryName,
            schemaName: schemaQuery.schemaName,
        })
            .then(queryInfo => {
                const { columns, hasUpdates } = getFinderViewColumnsConfig(
                    queryInfo,
                    columnDisplayNames,
                    requiredColumns
                );
                if (!hasUpdates) {
                    resolve(schemaQuery);
                    return;
                }
                Query.saveQueryViews({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    // Mark the view as hidden, so it doesn't show up in LKS and in the grid view menus
                    views: [{ name: SAMPLE_FINDER_VIEW_NAME, columns, hidden: true }],
                    success: () => {
                        invalidateQueryDetailsCache(schemaQuery);
                        resolve(schemaQuery);
                    },
                    failure: response => {
                        console.error(response);
                        reject(
                            'There was a problem creating the view for the data grid. ' + resolveErrorMessage(response)
                        );
                    },
                });
            })
            .catch(error => {
                console.error(error);
                reject('There was a problem creating the view for the data grid. ' + resolveErrorMessage(error));
            });
    });
}

export function saveFinderSearch(report: FinderReport, cardsJson: string, replace?: boolean): Promise<FinderReport> {
    const reportConfig = {
        name: report.reportName,
        reportId: replace ? report.reportId : null,
        config: cardsJson,
        public: false,
        replace,
    };

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'saveSampleFinderSearch.api'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            jsonData: reportConfig,
            success: Utils.getCallbackWrapper(json => {
                resolve({
                    reportName: json.reportName,
                    reportId: json.reportId,
                    entityId: json.id,
                });
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
        });
    });
}

export function loadFinderSearches(excludeModuleReport?: boolean): Promise<FinderReport[]> {
    return new Promise((resolve, reject) => {
        loadReports()
            .then((reports: IDataViewInfo[]) => {
                const views = reports
                    .filter(report => {
                        if (excludeModuleReport) {
                            if (report.reportId?.indexOf('module:SampleManagement') === 0) return false;
                        }
                        return report.type === DataViewInfoTypes.SampleFinderSavedSearch;
                    })
                    .map(report => {
                        const isModuleReport = report.reportId?.indexOf('module:SampleManagement') === 0;
                        return {
                            reportId: report.reportId,
                            reportName: report.name,
                            entityId: report.id,
                            isSession: false,
                            isModuleReport,
                        };
                    });
                resolve(views.sort((a, b) => a.reportName.localeCompare(b.reportName)));
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function loadFinderSearch(view: FinderReport): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getSampleFinderSearch.api'),
            params: { reportId: view.reportId, name: view.reportName },
            success: Utils.getCallbackWrapper(json => {
                resolve(json.config);
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
        });
    });
}

export function getSampleTypesFromFindByIdQuery(
    schemaQuery: SchemaQuery
): Promise<{ [key: string]: Array<Record<string, any>> }> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaQuery,
        })
            .then(response => {
                const sampleTypesRows = {};
                if (response.rows) {
                    response.rows.forEach(row => {
                        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue;
                        if (!sampleTypesRows[sampleType]) sampleTypesRows[sampleType] = [];
                        sampleTypesRows[sampleType].push(row);
                    });
                    resolve(sampleTypesRows);
                }
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getSampleFinderTabRowCounts(queryModels: {
    [key: string]: QueryModel;
}): Promise<{ [key: string]: number }> {
    const modelIds = Object.keys(queryModels);
    const sampleTypeGridIds = {};
    let allSamplesModel = null;
    const tabCounts = {};
    modelIds.forEach(modelId => {
        const model = queryModels[modelId];
        if (model.schemaQuery.schemaName === SCHEMAS.SAMPLE_SETS.SCHEMA) {
            sampleTypeGridIds[model.schemaQuery.queryName.toLowerCase()] = modelId;
        } else if (model.schemaQuery.schemaName === EXP_TABLES.MATERIALS.schemaName) {
            allSamplesModel = model;
        }
        tabCounts[modelId] = 0;
    });

    return new Promise((resolve, reject) => {
        Query.executeSql({
            containerFilter: getContainerFilter(),
            schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
            sql: getSampleFinderTabRowCountSql(allSamplesModel),
            success: result => {
                const typeCounts = {};
                result.rows?.forEach(row => {
                    const type = caseInsensitive(row, 'SampleTypeName');
                    typeCounts[type] = caseInsensitive(row, 'RowCount');
                });

                let totalCount = 0;
                Object.keys(typeCounts).forEach(type => {
                    const count = typeCounts[type];
                    totalCount += count;
                    const sampleGridId = sampleTypeGridIds[type.toLowerCase()];
                    tabCounts[sampleGridId] = count;
                });
                tabCounts[allSamplesModel.id] = totalCount;
                resolve(tabCounts);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}
