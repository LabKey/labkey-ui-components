import { List, Map } from 'immutable';
import { Ajax, Utils } from '@labkey/api';
import { buildURL } from '../../url/ActionURL';
import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';
import { SearchIdData, SearchResultCardData } from './models';
import { URLResolver } from '../../util/URLResolver';
import { SCHEMAS } from '../..';

export function searchUsingIndex(userConfig): Promise<List<Map<any, any>>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api'),
            method: 'GET',
            params: userConfig,
            success: Utils.getCallbackWrapper((json) => {
                addDataObjects(json);
                const urlResolver = new URLResolver();
                resolve(urlResolver.resolveSearchUsingIndex(json));
            }),
            failure: Utils.getCallbackWrapper((json) => {
                reject(json);
            }, null, false)
        });
    });
}

// Some search results will not have a data object.  Much of the display logic
// relies on this, so for such results that we want to show the user, we add a
// data element
function addDataObjects(jsonResults) {
    jsonResults.hits.forEach(hit => {

        if (hit.data === undefined) {
            let data = parseSearchIdToData(hit.id);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0)
                hit.data = data;
        }
    });
}

// Create a data object from the search id, which is assumed to be of the form:
//      [group:][type:]rowId
function parseSearchIdToData(idString): SearchIdData {
    let idData = new SearchIdData();
    if (idString) {
        let idParts = idString.split(":");

        idData.id = idParts[idParts.length - 1];
        if (idParts.length > 1)
            idData.type = idParts[idParts.length - 2];
        if (idParts.length > 2)
            idData.group = idParts[idParts.length - 3];
    }
    return idData;
}

function resolveTypeName(data: any) {

    let typeName;
    if (data) {
        if (data.getIn(['dataClass', 'name'])) {
            typeName = data.getIn(['dataClass', 'name']);
        }
        else if (data.getIn(['sampleSet', 'name'])) {
            typeName = data.getIn(['sampleSet', 'name']);
        }
    }
    return typeName;
}

function resolveIconSrc(data: any, category: string) : string {
    let iconSrc = '';
    if (data) {
        if (data.hasIn(['dataClass', 'name'])) {
            if ('sources' === data.getIn(['dataClass', 'category'])) //TODO make this more general
                iconSrc = 'sources';
            else
                iconSrc = data.getIn(['dataClass', 'name']).toLowerCase();
        }
        else if (data.hasIn(['sampleSet', 'name'])) {
            const sampleSetName = data.getIn(['sampleSet', 'name']).toLowerCase();

            switch (sampleSetName) {
                case SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName.toLowerCase():
                    iconSrc = 'ingredients';
                    break;
                case SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase():
                    iconSrc = 'batch';
                    break;
                default:
                    iconSrc = 'samples';
                    break;
            }
        }
        else if (data.has('type')) {
            const lcType = data.get('type').toLowerCase();
            if (lcType === 'sampleset') {
                iconSrc='sample_set';
            }
            else if (lcType === 'dataclass') {
                iconSrc='default'; // we don't have a generic "data class" icon; default works just fine.
            }
            else {
                iconSrc = lcType;
            }
        }
    }
    if (!iconSrc && category) {
        switch (category)
        {
            case 'workflowJob':
                iconSrc = 'workflow';
                break;
            case 'material':
                iconSrc = 'samples';
                break;
        }
    }
    return iconSrc
}

export function getSearchResultCardData(data: any, category: string, title: string) : SearchResultCardData {
    return {
        title: title,
        iconSrc: resolveIconSrc(data, category),
        typeName: resolveTypeName(data)
    }
}
