import { List, Map } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/ActionURL';
import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { URLResolver } from '../../util/URLResolver';
import { SCHEMAS } from '../..';

import { SearchIdData, SearchResultCardData } from './models';

export function searchUsingIndex(userConfig): Promise<List<Map<any, any>>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api'),
            method: 'GET',
            params: userConfig,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                const urlResolver = new URLResolver();
                resolve(urlResolver.resolveSearchUsingIndex(json));
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
        if (hit.data === undefined) {
            const data = parseSearchIdToData(hit.id);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0) hit.data = data;
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

function resolveTypeName(data: Map<string, any>) {
    let typeName;
    if (data) {
        if (data.getIn(['dataClass', 'name'])) {
            typeName = data.getIn(['dataClass', 'name']);
        } else if (data.getIn(['sampleSet', 'name'])) {
            typeName = data.getIn(['sampleSet', 'name']);
        }
    }
    return typeName;
}

function resolveIconSrc(data: Map<string, any>, category: string): string {
    let iconSrc = '';
    if (data) {
        if (data.hasIn(['dataClass', 'name'])) {
            iconSrc = data.getIn(['dataClass', 'name']).toLowerCase();
        } else if (data.hasIn(['sampleSet', 'name'])) {
            iconSrc = 'samples';
        } else if (data.has('type')) {
            const lcType = data.get('type').toLowerCase();
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

export function getSearchResultCardData(data: Map<any, any>, category: string, title: string): SearchResultCardData {
    return {
        title,
        iconSrc: resolveIconSrc(data, category),
        typeName: resolveTypeName(data),
    };
}
