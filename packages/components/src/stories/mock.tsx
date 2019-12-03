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
import { fromJS } from 'immutable';
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
import nameExpressionSelectedQuery from '../test/data/nameExpressionSet-selected-getQuery.json';
import sampleSet2QueryInfo from '../test/data/sampleSet2-getQueryDetails.json';
import sampleSetsQuery from '../test/data/sampleSets-getQuery.json';
import sampleSetsQueryInfo from '../test/data/sampleSets-getQueryDetails.json';
import assayRunsWithQCFlagsQueryInfo from '../test/data/assayQCFlagsWarning-getQueryDetails.json';
import assayRunsWithQCFlagsQuery from '../test/data/assayQCFlagsWarning-getQuery.json';
import assayFileDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck.json'
import assayFileNoDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck_false.json'
import deleteAllConfirmation from '../test/data/deleteAll-getMaterialDeleteConfirmationData.json';
import deleteNoneConfirmation from '../test/data/deleteNone-getMaterialDeleteConfirmationData.json';
import deleteOneConfirmation from '../test/data/deleteOne-getMaterialDeleteConfirmationData.json';
import deleteSomeConfirmation from '../test/data/deleteSome-getMaterialDeleteConfirmationData.json';
import sampleSetAllFieldTypesQueryInfo from '../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import assayGpatRunsQueryInfo from '../test/data/assayGpatRuns-getQueryDetails.json';
import assayGpatDataQueryInfo from '../test/data/assayGpatData-getQueryDetails.json';
import assayGpatRunData from '../test/data/assayGpatRuns-getQuery.json';
import filePreviewData from '../test/data/property-getFilePreview.json';
import visualizationConfig from '../test/data/visualization-getVisualization.json';
import lineageData from '../test/data/experiment-lineage.json';
import samplesLineageQuery from '../test/data/sampleLineage-getQuery.json';
import expSystemSamplesLineageQuery from '../test/data/expSystemSampleLineage-getQuery.json';
import expSystemLineageQuery from '../test/data/expSystemLineage-getQuery.json';
import expressionsystemsamplesQueryInfo from '../test/data/expSystemSamples-getQueryDetails.json';
import expressionsystemQueryInfo from '../test/data/expSystem-getQueryDetails.json';
import assayImageFieldRunsQueryInfo from '../test/data/assayImageFieldRuns-getQueryDetails.json';
import assayImageFieldRunsQuery from '../test/data/assayImageFieldRuns-getQuery.json';
import labbookQueryInfo from '../test/data/labbook-getQueryDetails.json';
import labbookQuery from '../test/data/labbook-getQuery.json';
import usersQueryInfo from '../test/data/users-getQueryDetails.json';
import getMaxPhiLevelJson from "../test/data/security-GetMaxPhiLevel.json";
import getRolesJson from "../test/data/security-getRoles.json";
import getPrincipalsJson from "../test/data/security-getPrincipals.json";
import getQueryDetailsPrincipalsJson from "../test/data/security-getQueryDetailsPrincipals.json";
import inferDomainJson from '../test/data/property-inferDomain.json';
import getValidPublishTargetsJson from '../test/data/assay-getValidPublishTargets.json';

export const ICON_URL = 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png';

const QUERY_DETAILS_RESPONSES = fromJS({
    'assay.general.amino acids': {
        'runs': assayRunsWithQCFlagsQueryInfo,
    },
    'assay.general.gpat 1': {
        'data': assayGpatDataQueryInfo,
        'runs': assayGpatRunsQueryInfo,
    },
    'assay.general.imagefieldassay': {
        'runs': assayImageFieldRunsQueryInfo,
    },
    'core': {
        'users': usersQueryInfo,
        'core_temp_240': getQueryDetailsPrincipalsJson,
    },
    'exp': {
        'samplesetheatmap': sampleSetHeatMapQueryInfo,
        'assaysheatmap': assaysHeatMapQueryInfo,
        'samplesets': sampleSetsQueryInfo,
    },
    'exp.data': {
        'mixtures': mixturesQueryInfo,
        'expressionsystem': expressionsystemQueryInfo,
    },
    'labbook': {
        'labbookexperiment': labbookQueryInfo,
    },
    'lists': {
        'mixturetypes': mixtureTypesQueryInfo,
        'lookuplist': lookuplistQueryInfo,
    },
    'samples': {
        'samples': sampleSetQueryInfo,
        'sample set 2': sampleSet2QueryInfo,
        'expressionsystemsamples': expressionsystemsamplesQueryInfo,
        'samplesetwithallfieldtypes': sampleSetAllFieldTypesQueryInfo,
        'name expression set': nameExpressionQueryInfo,
        'name%20expression%20set': nameExpressionQueryInfo,
    },
    'schema': {
        'gridwithoutdata': mixturesQueryInfo,
    }
});

const QUERY_RESPONSES = fromJS({
    'assay.general.amino acids': {
        'runs': assayRunsWithQCFlagsQuery,
    },
    'assay.general.gpat 1': {
        'runs': assayGpatRunData,
    },
    'assay.general.imagefieldassay': {
        'runs': assayImageFieldRunsQuery,
    },
    'exp': {
        'samplesetheatmap': sampleSetHeatMapQuery,
        'assaysheatmap': assaysHeatMapQuery,
        'samplesets': sampleSetsQuery,
    },
    'exp.data': {
        'mixtures': mixturesQuery,
        'expressionsystem': expSystemLineageQuery
    },
    'labbook': {
        'labbookexperiment': labbookQuery,
    },
    'lists': {
        'mixturetypes': mixtureTypesQuery,
        'lookuplist': lookuplistQuery,
    },
    'samples': {
        'samples': sampleDetailsQuery,
        'expressionsystemsamples': expSystemSamplesLineageQuery,
        'samplesetwithallfieldtypes': samplesLineageQuery,
        'name expression set': nameExpressionSelectedQuery,
    },
    'schema': {
        'gridwithoutdata': noDataQuery,
    }
});

export function initMocks() {
    mock.setup();

    mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
        const queryParams = req.url().query;
        const schemaName = queryParams.schemaName.toLowerCase();
        const queryName = queryParams.queryName.toLowerCase();
        const responseBody = QUERY_DETAILS_RESPONSES.getIn([schemaName, queryName]);

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
        const params = decodeURIComponent(req.body()).split('&').reduce((result, param) => {
            const [name, value] = param.split('=');
            result[name] = value;
            return result;
        }, {}) as any;
        const queryName = params['query.queryName'].toLowerCase();
        const schemaName = params.schemaName.toLowerCase();
        let responseBody = QUERY_RESPONSES.getIn([schemaName, queryName]);

        if (!responseBody) {
            console.log(`getQuery response not found! schemaName: "${schemaName}" queryName: "${queryName}"`);
        }

        if (schemaName === 'samples' && queryName === 'samples' && params.hasOwnProperty('query.rowId~in')) {
            // Used in lineage stories.
            responseBody = samplesLineageQuery;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/query\/.*\/executeSql.*/,  (req, res) => {
        const body = decodeURIComponent(req.body());

        let responseBody;
        if (body.indexOf('"core"') > -1 && body.indexOf('FROM Principals') > -1) {
            responseBody = getPrincipalsJson
        }

        if (!responseBody) {
            console.log(`executeSql response not found! "${body}"`);
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.get(/.*\/query\/.*\/getSchemas.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.schemaName === undefined) {
            responseBody = getSchemasJson;
        } else if (queryParams.schemaName.toLowerCase() === 'assay') {
            responseBody = assayGetSchemasJson;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.get(/.*\/query\/.*\/getQueries.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.schemaName.toLowerCase() === 'assay') {
            responseBody = assayGetQueriesJson;
        }
        
        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/query\/.*\/updateRows.*/,  (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;
        
        if (bodyParams.indexOf("\"queryname\":\"samples\"") > -1) {
            responseBody = samplesUpdate;
        }
        
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
        const key = queryParams.key;
        let responseBody;
        
        if (key && key.toLowerCase() === "sample-set-name%20expression%20set|samples/name%20expression%20set") {
            responseBody = nameExpressionSelected;
        } else {
            responseBody = mixturesSelected;
        }

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
        if (selectionKey === 'deleteNone') {
            responseBody = deleteNoneConfirmation;
        } else if (selectionKey === 'deleteOne') {
            responseBody = deleteOneConfirmation;
        } else if (selectionKey === 'deleteSome') {
            responseBody = deleteSomeConfirmation;
        } else if (selectionKey === 'deleteAll') {
            responseBody = deleteAllConfirmation;
        }
        
        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*FileDuplicateCheck.*/, (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;
        
        if ((bodyParams.indexOf(".csv") > -1) || (bodyParams.indexOf('.tsv') > -1)) {
            responseBody = assayFileDuplicateCheck;
        } else if (bodyParams.indexOf(".xls") > -1) {
            responseBody= assayFileNoDuplicateCheck;
        }
        
        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody))
    });

    mock.get(/.*getFilePreview.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        
        if (queryParams.file === "1949" || queryParams.file === "2010") {
            responseBody = filePreviewData;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.get(/.*lineage.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        if (queryParams.lsid.indexOf('ES-1.2') > -1) {
            responseBody = lineageData;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/visualization\/.*\/getVisualization.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(visualizationConfig),
    });

    mock.post(/.*\/property\/inferDomain.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(inferDomainJson)
    });

    mock.get(/.*\/security\/GetMaxPhiLevel.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getMaxPhiLevelJson)
    });

    mock.get(/.*\/security\/.*\/getRoles.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getRolesJson)
    });

    mock.get(/.*\/assay\/getValidPublishTargets.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getValidPublishTargetsJson)
    });


    mock.use(proxy);
}
