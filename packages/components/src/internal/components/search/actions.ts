import { List, Map } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/ActionURL';
import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { URLResolver } from '../../util/URLResolver';
import { SCHEMAS } from '../../../index';

import { SearchIdData, SearchResultCardData } from './models';

export function searchUsingIndex(
    userConfig,
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData
): Promise<{}> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api'),
            method: 'GET',
            params: userConfig,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                const urlResolver = new URLResolver();
                urlResolver.resolveSearchUsingIndex(json).then(results => {
                    resolve({ ...results, hits: getProcessedSearchHits(results['hits'], getCardDataFn) });
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
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData
): {} {
    return results
        ? results
              .filter(result => {
                  const category = result['category'];
                  return (
                      category == 'data' ||
                      category == 'material' ||
                      category == 'workflowJob' ||
                      category == 'file workflowJob' ||
                      result['data']
                  );
              })
              .map(result => {
                  return {
                      ...result,
                      cardData: getCardData(result['category'], result['data'], result['title'], getCardDataFn),
                  };
              })
        : undefined;
}
