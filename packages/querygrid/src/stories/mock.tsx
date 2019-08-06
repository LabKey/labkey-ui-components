/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import mock, { proxy } from 'xhr-mock';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixtureTypesQueryInfo from '../test/data/mixtureTypes-getQueryDetails.json';
import mixtureTypesQuery from '../test/data/mixtureTypes-getQuery.json';
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
import nameExpressionQueryInfo from '../test/data/nameExpressionSet-getQueryDetails.json';
import nameExpressionSelected from '../test/data/nameExpressionSet-getSelected.json';
import nameExpressionSelectedQuery from "../test/data/nameExpressionSet-selected-getQuery.json";
import sampleSet2QueryInfo from '../test/data/sampleSet2-getQueryDetails.json';
import sampleSetsQuery from '../test/data/sampleSets-getQuery.json';
import sampleSetsQueryInfo from '../test/data/sampleSets-getQueryDetails.json';
import assayRunsWithQCFlagsQuery from '../test/data/assayQCFlagsWarning-getQuery.json';
import assayRunsWithQCFlagsQueryInfo from '../test/data/assayQCFlagsWarning-getQueryDetails.json';
import assayFileDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck.json'
import assayFileNoDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck_false.json'
const deleteAllConfirmation = require("../test/data/deleteAll-getMaterialDeleteConfirmationData.json");
const deleteNoneConfirmation = require("../test/data/deleteNone-getMaterialDeleteConfirmationData.json");
const deleteOneConfirmation = require("../test/data/deleteOne-getMaterialDeleteConfirmationData.json");
const deleteSomeConfirmation = require("../test/data/deleteSome-getMaterialDeleteConfirmationData.json");
const sampleSetAllFieldTypesQueryInfo = require("../test/data/sampleSetAllFieldTypes-getQueryDetails.json");
const assayDataQueryInfo = require("../test/data/assayData-getQueryDetails.json");
const assayGpatQueryInfo= require("../test/data/assayGpat-getQueryDetails.json");
const assayGpatRunData = require("../test/data/assayGpatRuns-getQuery.json");
const filePreviewData = require("../test/data/property-getFilePreview.json");


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
        else if (lcSchemaName === 'assay.general.amino acids' && lcQueryName === 'runs')
            responseBody = assayRunsWithQCFlagsQueryInfo;
        else if (lcSchemaName === 'assay.general.gpat 1' && lcQueryName === 'data')
            responseBody = assayDataQueryInfo;
        else if (lcSchemaName === 'assay.general.gpat 1' && lcQueryName === 'runs') {
            responseBody = assayGpatQueryInfo;
        }

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
        else if (bodyParams.indexOf("&query.queryname=runs") > -1) {
            responseBody = assayGpatRunData;
        }

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

    mock.get(/.*ConfirmationData.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        let selectionKey = queryParams.dataRegionSelectionKey;
        if (selectionKey === 'deleteNone')
            responseBody = deleteNoneConfirmation;
        else if (selectionKey === 'deleteOne')
            responseBody = deleteOneConfirmation;
        else if (selectionKey === 'deleteSome')
            responseBody = deleteSomeConfirmation;
        else if (selectionKey === 'deleteAll')
            responseBody = deleteAllConfirmation;

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*FileDuplicateCheck.*/, (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;
        if ((bodyParams.indexOf(".csv") > -1) || (bodyParams.indexOf('.tsv') > -1))
            responseBody = assayFileDuplicateCheck;
        else if (bodyParams.indexOf(".xls") > -1)
            responseBody= assayFileNoDuplicateCheck;
        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody))
    });

    mock.get(/.*getFilePreview.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        if (queryParams.file === "1949") {
            responseBody = filePreviewData;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.use(proxy);
}