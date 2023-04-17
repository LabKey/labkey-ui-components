import { Map } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { getPrimaryAppProperties, getProjectPath, isAllProductFoldersFilteringEnabled } from '../../app/utils';

import { incrementClientSideMetricCount } from '../../actions';
import { buildURL } from '../../url/AppURL';
import { URLResolver } from '../../url/URLResolver';
import { handleRequestFailure } from '../../util/utils';

import { ModuleContext } from '../base/ServerContext';

import { SearchIdData, SearchResultCardData } from './models';
import { SearchScope } from './constants';

export type GetCardDataFn = (data: Map<any, any>, category?: string) => SearchResultCardData;

export interface SearchHit {
    category?: string;
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
    category?: string;
    experimentalCustomJson?: boolean;
    limit?: number;
    normalizeUrls?: boolean;
    offset?: number;
    q: string;
    scope?: SearchScope;
}

export type Search = (options: SearchOptions, moduleContext?: ModuleContext) => Promise<SearchResult>;

export const search: Search = (options, moduleContext) => {
    let containerPath: string;
    if (isAllProductFoldersFilteringEnabled(moduleContext)) {
        containerPath = getProjectPath();
        options.scope = SearchScope.FolderAndSubfoldersAndShared;
    }

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api', undefined, {
                container: containerPath,
            }),
            params: options,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                resolve(new URLResolver().resolveSearchUsingIndex(json));
            }),
            failure: handleRequestFailure(reject, 'Failed search query'),
        });
    });
};

export interface SearchHitWithCardData extends SearchHit {
    cardData: SearchResultCardData;
}

export interface SearchResultWithCardData extends Omit<SearchResult, 'hits'> {
    hits: SearchHitWithCardData[];
}

export async function searchUsingIndex(
    options: SearchOptions,
    getCardDataFn?: GetCardDataFn,
    filterCategories?: string[]
): Promise<SearchResultWithCardData> {
    const appProps = getPrimaryAppProperties();
    if (appProps?.productId) {
        incrementClientSideMetricCount(appProps.productId + 'Search', 'count');
    }

    const result = await search(options);
    return { ...result, hits: getProcessedSearchHits(result.hits, getCardDataFn, filterCategories) };
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

export function getProcessedSearchHits(
    hits: SearchHit[],
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData,
): any[] {
    return hits?.map(result => ({
        ...result,
        cardData: getCardData(result.category, result.data, result.title, getCardDataFn),
    }));
}
