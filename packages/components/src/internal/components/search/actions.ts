import { Map } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { getPrimaryAppProperties, getProjectPath, isAllProductFoldersFilteringEnabled } from '../../app/utils';

import { incrementClientSideMetricCount } from '../../actions';
import { buildURL } from '../../url/AppURL';
import { URLResolver } from '../../url/URLResolver';
import { SearchIdData, SearchResultCardData } from './models';
import { SearchScope } from './constants';

export type GetCardDataFn = (data: Map<any, any>, category?: string) => SearchResultCardData;

export interface SearchOptions {
    category?: string;
    experimentalCustomJson?: boolean;
    limit?: number;
    normalizeUrls?: boolean;
    offset?: number;
    q: any;
    scope?: SearchScope;
}

export function searchUsingIndex(
    options: SearchOptions,
    getCardDataFn?: GetCardDataFn,
    filterCategories?: string[]
): Promise<Record<string, any>> {
    const appProps = getPrimaryAppProperties();
    if (appProps?.productId) {
        incrementClientSideMetricCount(appProps.productId + 'Search', 'count');
    }

    let containerPath: string;
    if (isAllProductFoldersFilteringEnabled()) {
        containerPath = getProjectPath();
        options.scope = SearchScope.FolderAndSubfoldersAndShared;
    }
    if (filterCategories) {
        options.category = filterCategories?.join('+');
    }

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api', undefined, {
                container: containerPath,
            }),
            params: options,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                const results = new URLResolver().resolveSearchUsingIndex(json);
                const hits = getProcessedSearchHits(results['hits'], getCardDataFn);
                resolve({ ...results, hits });
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
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

// exported for jest testing
export function resolveTypeName(data: any, category: string) {
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

export function getProcessedSearchHits(
    hits: any[],
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData
): any[] {
    return hits?.map(result => ({
        ...result,
        cardData: getCardData(result.category, result.data, result.title, getCardDataFn),
    }));
}
