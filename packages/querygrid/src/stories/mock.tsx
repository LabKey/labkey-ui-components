import mock, { proxy } from 'xhr-mock';
import { fromJS } from 'immutable';
import { initNotificationsState } from "@glass/base";

import { initQueryGridState } from "../global";
import { initBrowserHistoryState } from "../util/global";
import { SCHEMAS } from "../query/schemas";

import mixturesQueryInfo from "../test/data/mixtures-getQueryDetails.json";
import mixtureTypesQueryInfo from "../test/data/mixtureTypes-getQueryDetails.json";
import mixtureTypesQuery from "../test/data/mixtureTypes-getQuery.json";
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import mixturesSelected from '../test/data/mixtures-getSelected.json';
import mixturesReportInfos from '../test/data/mixtures-getReportInfos.json';
import samplesInsert from '../test/data/samples-insertRows.json';
import noDataQuery from '../test/data/noData-getQuery.json';
import getSchemasJson from '../test/data/getSchemas.json';
import assayGetSchemasJson from '../test/data/assay-getSchemas.json';
import assayGetQueriesJson from '../test/data/assay-getQueries.json';
import sampleSetHeatMapQueryInfo from '../test/data/sampleSetHeatMap-getQueryDetails.json';
import sampleSetHeatMapQuery from '../test/data/sampleSetHeatMap-getQuery.json';
import assaysHeatMapQueryInfo from '../test/data/assaysHeatMap-getQueryDetails.json';
import assaysHeatMapQuery from '../test/data/assaysHeatMap-getQuery.json';
import sampleSetQueryInfo from '../test/data/samplesSet-getQueryDetails.json';
import sampleDetailsQuery from '../test/data/sampleDetails-getQuery.json';
import lookuplistQueryInfo from '../test/data/lookuplist-getQueryDetails.json';
import lookuplistQuery from '../test/data/lookuplist-getQuery.json';
import samplesUpdate from '../test/data/samples-updateRows.json';

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.schemaName.toLowerCase() === 'exp.data' && queryParams.queryName.toLowerCase() === 'mixtures')
        responseBody = mixturesQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'schema' && queryParams.queryName.toLowerCase() === 'gridwithoutdata')
        responseBody = mixturesQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'lists' && queryParams.queryName.toLowerCase() === 'mixturetypes')
        responseBody = mixtureTypesQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'exp' && queryParams.queryName.toLowerCase() === 'samplesetheatmap')
        responseBody = sampleSetHeatMapQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'exp' && queryParams.queryName.toLowerCase() === 'assaysheatmap')
        responseBody = assaysHeatMapQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'samples' && queryParams.queryName.toLowerCase() === 'samples')
        responseBody = sampleSetQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'lists' && queryParams.queryName.toLowerCase() === 'lookuplist')
        responseBody = lookuplistQueryInfo;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
    const bodyParams = req.body().toLowerCase();
    let responseBody;
    if (bodyParams.indexOf("&query.queryname=mixtures&") > -1)
        responseBody = mixturesQuery;
    else if (bodyParams.indexOf("&query.queryname=mixturetypes&") > -1)
        responseBody = mixtureTypesQuery;
    else if (bodyParams.indexOf("&query.queryname=gridwithoutdata&") > -1)
        responseBody = noDataQuery;
    else if (bodyParams.indexOf("&query.queryname=samplesetheatmap&") > -1)
        responseBody = sampleSetHeatMapQuery;
    else if (bodyParams.indexOf("&query.queryname=assaysheatmap&") > -1)
        responseBody = assaysHeatMapQuery;
    else if (bodyParams.indexOf("&query.queryname=samples&") > -1)
        responseBody = sampleDetailsQuery;
    else if (bodyParams.indexOf("&query.queryname=lookuplist&") > -1)
        responseBody = lookuplistQuery;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.get(/.*\/query\/.*\/getSchemas.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.schemaName === undefined)
        responseBody = getSchemasJson;
    else if (queryParams.schemaName.toLowerCase() === 'assay')
        responseBody = assayGetSchemasJson;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.get(/.*\/query\/.*\/getQueries.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.schemaName.toLowerCase() === 'assay')
        responseBody = assayGetQueriesJson;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.post(/.*\/query\/.*\/updateRows.*/,  (req, res) => {
    const bodyParams = req.body().toLowerCase();
    console.log(bodyParams);
    let responseBody;
    if (bodyParams.indexOf("\"queryname\":\"samples\"") > -1)
        responseBody = samplesUpdate;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

//TODO conditionalize based on queryName
mock.post(/.*\/query\/.*\/insertRows.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(samplesInsert)
});

//TODO conditionalize based on queryName
mock.get(/.*\/query\/.*\/getSelected.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixturesSelected)
});

//TODO conditionalize based on queryName
mock.get(/.*\/study-reports\/.*\/getReportInfos.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixturesReportInfos)
});

mock.use(proxy);

initQueryGridState(fromJS({
    concepts: {
        'http://www.labkey.org/exp/xml#alias': {
            inputRenderer: 'ExperimentAlias',
            columnRenderer: 'AliasRenderer',
            detailRenderer: 'AliasRenderer'
        }
    },
    columnDefaults: {
        flag: {
            removeFromViews: true
        }
    },
    schema: {
        [SCHEMAS.SAMPLE_SETS.SCHEMA]: {
            columnDefaults: {
                name: {
                    caption: 'Sample ID',
                    shownInUpdateView: false
                }
            },
            queryDefaults: {
                appEditableTable: true
            }
        }
    }
}));

initBrowserHistoryState();
initNotificationsState();