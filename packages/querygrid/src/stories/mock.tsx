import mock, { proxy } from 'xhr-mock';
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
import nameExpressionQueryInfo from "../test/data/nameExpressionSet-getQueryDetails.json";
import nameExpressionSelected from "../test/data/nameExpressionSet-getSelected.json";
import nameExpressionSelectedQuery from "../test/data/nameExpressionSet-selected-getQuery.json";
import sampleSet2QueryInfo from "../test/data/sampleSet2-getQueryDetails.json";
import sampleSetsQuery from "../test/data/sampleSets-getQuery.json";
import sampleSetsQueryInfo from "../test/data/sampleSets-getQueryDetails.json";
const sampleSetAllFieldTypesQueryInfo = require("../test/data/sampleSetAllFieldTypes-getQueryDetails.json");

export function initMocks() {
    mock.setup();

    mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        let lcSchemaName = queryParams.schemaName.toLowerCase();
        let lcQueryName = queryParams.queryName.toLowerCase();
        if (lcSchemaName === 'exp.data' && lcQueryName === 'mixtures')
            responseBody = mixturesQueryInfo;
        else if (lcSchemaName === 'schema' && lcQueryName === 'gridwithoutdata')
            responseBody = mixturesQueryInfo;
        else if (lcSchemaName === 'lists' && lcQueryName === 'mixturetypes')
            responseBody = mixtureTypesQueryInfo;
        else if (lcSchemaName === 'exp' && lcQueryName === 'samplesetheatmap')
            responseBody = sampleSetHeatMapQueryInfo;
        else if (lcSchemaName === 'exp' && lcQueryName === 'assaysheatmap')
            responseBody = assaysHeatMapQueryInfo;
        else if (lcSchemaName === 'samples' && lcQueryName === 'samples')
            responseBody = sampleSetQueryInfo;
        else if (lcSchemaName === 'samples' && lcQueryName === 'samplesetwithallfieldtypes')
            responseBody = sampleSetAllFieldTypesQueryInfo;
        else if (lcSchemaName === 'lists' && lcQueryName === 'lookuplist')
            responseBody = lookuplistQueryInfo;
        else if (lcSchemaName === 'exp' && lcQueryName === 'samplesets')
            responseBody = sampleSetsQueryInfo;
        else if (lcSchemaName === 'samples' && (lcQueryName === 'name expression set' || lcQueryName === 'name%20expression%20set'))
            responseBody = nameExpressionQueryInfo;
        else if (lcSchemaName === 'samples' && lcQueryName === 'sample set 2')
            responseBody = sampleSet2QueryInfo;

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
        else if (bodyParams.indexOf("&query.queryname=samplesets&") > -1)
            responseBody = sampleSetsQuery;
        else if (bodyParams.indexOf("&query.queryname=name%2520expression%2520set") > -1 && bodyParams.indexOf("&query.rowid~in=459") > -1)
            responseBody = nameExpressionSelectedQuery;
        else if (bodyParams.indexOf("&query.queryname=name%20expression%20set") > -1)
            responseBody = nameExpressionSelectedQuery;

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

    mock.get(/.*\/query\/.*\/getSelected.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        if (queryParams.key.toLowerCase() === "sample-set-name%20expression%20set|samples/name%20expression%20set")
            responseBody = nameExpressionSelected;
        else
            responseBody = mixturesSelected;

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    //TODO conditionalize based on queryName
    mock.get(/.*\/study-reports\/.*\/getReportInfos.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mixturesReportInfos)
    });

    mock.use(proxy);
}