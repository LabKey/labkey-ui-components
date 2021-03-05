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
import mock, { MockResponse, proxy, delay } from 'xhr-mock';
import { fromJS } from 'immutable';

import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixtureTypesQueryInfo from '../test/data/mixtureTypes-getQueryDetails.json';
import mixtureTypesQuery from '../test/data/mixtureTypes-getQuery.json';
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import mixturesQueryPaging from '../test/data/mixtures-getQueryPaging.json';
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
import dataClassCategoryTypeQuery from '../test/data/dataClassCategoryType-getQuery.json';
import dataClassCategoryTypeQueryInfo from '../test/data/dataClassCategoryType-getQueryDetails.json';
import dataClassesQuery from '../test/data/dataClasses-getQuery.json';
import dataClassesQueryInfo from '../test/data/dataClasses-getQueryDetails.json';
import assayRunsWithQCFlagsQueryInfo from '../test/data/assayQCFlagsWarning-getQueryDetails.json';
import assayRunsWithQCFlagsQuery from '../test/data/assayQCFlagsWarning-getQuery.json';
import assayFileDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck.json';
import assayFileNoDuplicateCheck from '../test/data/assay-assayFileDuplicateCheck_false.json';
import assayAssayListDetails from '../test/data/assay-assayListDetails.json';
import assayAssayList from '../test/data/assay-assayList.json';
import deleteAllConfirmation from '../test/data/deleteAll-getMaterialDeleteConfirmationData.json';
import deleteNoneConfirmation from '../test/data/deleteNone-getMaterialDeleteConfirmationData.json';
import deleteOneConfirmation from '../test/data/deleteOne-getMaterialDeleteConfirmationData.json';
import deleteSomeConfirmation from '../test/data/deleteSome-getMaterialDeleteConfirmationData.json';
import sampleSetAllFieldTypesQueryInfo from '../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import assayGpatRunsQueryInfo from '../test/data/assayGpatRuns-getQueryDetails.json';
import assayGpatDataQueryInfo from '../test/data/assayGpatData-getQueryDetails.json';
import assayGpatRunData from '../test/data/assayGpatRuns-getQuery.json';
import getAssayDesignSectionOptions from '../test/data/assay-getAssayDesignSelectOptions.json';
import filePreviewData from '../test/data/property-getFilePreview.json';
import visualizationConfig from '../test/data/visualization-getVisualization.json';
import lineageRunDetail from '../test/data/aminoAcidDetail-getQuery.json';
import lineageRunData from '../test/data/experiment-lineage-run.json';
import lineageSampleData from '../test/data/experiment-lineage.json';
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
import usersQuery from '../test/data/users-getQuery.json';
import userPropsInfo from '../test/data/user-getUserProps.json';
import getMaxPhiLevelJson from '../test/data/security-GetMaxPhiLevel.json';
import getRolesJson from '../test/data/security-getRoles.json';
import getPrincipalsJson from '../test/data/security-getPrincipals.json';
import getMembersJson from '../test/data/security-getMembers.json';
import getQueryDetailsPrincipalsJson from '../test/data/security-getQueryDetailsPrincipals.json';
import inferDomainJson from '../test/data/property-inferDomain.json';
import getValidPublishTargetsJson from '../test/data/assay-getValidPublishTargets.json';
import browseData from '../test/data/example_browse_data_tree_api.json';
import assayAminoAcidsDataQueryInfo from '../test/data/assayAminoAcidsData-getQueryDetails.json';
import assayAminoAcidsDataQuery from '../test/data/assayAminoAcidsData-getQuery.json';
import sampleWithParentsQuery from '../test/data/sampleWithParents-getQuery.json';
import sampleWithParentsQueryDetails from '../test/data/sampleWithParents-getQueryDetails.json';
import sampleWithTwoSourcesQuery from '../test/data/sampleWithTwoSources-getQuery.json';
import runsQuery from '../test/data/exp-runs-getQuery.json';
import runsQueryInfo from '../test/data/exp-runs-getQueryDetails.json';
import hemoglobinLineageQueryEq from '../test/data/samples-hemoglobin-getQuery-eq.json';
import hemoglobinLineageQueryIn from '../test/data/samples-hemoglobin-getQuery-in.json';
import hemoglobinLineageQueryInfo from '../test/data/samples-hemoglobin-getQueryDetails.json';
import secondSourceQuery from '../test/data/secondSource-getQuery.json';
import secondSourceQueryDetails from '../test/data/secondSource-getQueryDetails.json';
import source1Query from '../test/data/source1-getQuery.json';
import source1QueryDetails from '../test/data/source1-getQueryDetails.json';
import issuesProjectGroups from '../test/data/issues-getProjectGroups.json';
import issuesUsersForGroup from '../test/data/issues-getUsersForGroup.json';
import ontologiesQuery from '../test/data/ontologies-getQuery.json';
import serverNotifications from '../test/data/notification-getUserNotificationsForPanel.json';
import pipelineJobQueryDetails from '../test/data/pipelineJob-getQueryDetails.json';
import pipelineJobQuery from '../test/data/pipelineJob-getQuery.json';
import pipelineStatusDetails from '../test/data/pipelineStatusDetails.json';
import getModulesInfo from '../test/data/admin-getModules.json';
import getRegisteredProductsInfo from '../test/data/product-getRegisteredProducts.json';
import getProjectContainersInfo from '../test/data/project-getProjectContainers.json';
import getLKSMMenuSectionsInfo from '../test/data/product-getMenuSections-lksm.json';
import getLKBMenuSectionsInfo from '../test/data/product-getMenuSections-lkb.json';
import getFolderTabsInfo from '../test/data/admin-getFolderTabs.json';
import getOntologyChildPathsInfo from '../test/data/ontologies-getChildPaths.json';
import getOntologiesChildPathsInfo from '../test/data/ontologies-getRootChildPaths.json';
import getOntologyInfo from '../test/data/ontologies-getOntology.json';
import getAlternateConceptPaths from '../test/data/ontologies-getAlternateConceptPaths.json';
import getConceptParentPaths from '../test/data/ontologies-getParentPaths.json';

export const ICON_URL = 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const QUERY_DETAILS_RESPONSES = fromJS({
    assay: {
        assaylist: assayAssayListDetails,
    },
    'assay.general.amino acids': {
        runs: assayRunsWithQCFlagsQueryInfo,
        data: assayAminoAcidsDataQueryInfo,
    },
    'assay.general.gpat 1': {
        data: assayGpatDataQueryInfo,
        runs: assayGpatRunsQueryInfo,
        emptyruns: assayGpatRunsQueryInfo,
    },
    'assay.general.imagefieldassay': {
        runs: assayImageFieldRunsQueryInfo,
    },
    core: {
        users: usersQueryInfo,
        core_temp_240: getQueryDetailsPrincipalsJson,
        members: getMembersJson,
    },
    exp: {
        samplesetheatmap: sampleSetHeatMapQueryInfo,
        assaysheatmap: assaysHeatMapQueryInfo,
        samplesets: sampleSetsQueryInfo,
        dataclasses: dataClassesQueryInfo,
        dataclasscategorytype: dataClassCategoryTypeQueryInfo,
        runs: runsQueryInfo,
    },
    'exp.data': {
        mixtures: mixturesQueryInfo,
        mixturesbad: mixturesQueryInfo,
        mixturespaging: mixturesQueryInfo,
        expressionsystem: expressionsystemQueryInfo,
        'second source': secondSourceQueryDetails,
        'source 1': source1QueryDetails,
    },
    labbook: {
        labbookexperiment: labbookQueryInfo,
    },
    lists: {
        mixturetypes: mixtureTypesQueryInfo,
        lookuplist: lookuplistQueryInfo,
    },
    pipeline: {
        job: pipelineJobQueryDetails,
    },
    samples: {
        hemoglobin: hemoglobinLineageQueryInfo,
        samples: sampleSetQueryInfo,
        'sample set 2': sampleSet2QueryInfo,
        expressionsystemsamples: expressionsystemsamplesQueryInfo,
        samplesetwithallfieldtypes: sampleSetAllFieldTypesQueryInfo,
        'name expression set': nameExpressionQueryInfo,
        'name%20expression%20set': nameExpressionQueryInfo,
        examples: sampleWithParentsQueryDetails,
        multisource: sampleWithParentsQueryDetails,
    },
    schema: {
        gridwithoutdata: mixturesQueryInfo,
    },
});

const QUERY_RESPONSES = fromJS({
    assay: {
        assaylist: assayAssayList,
    },
    'assay.general.amino acids': {
        runs: assayRunsWithQCFlagsQuery,
        data: assayAminoAcidsDataQuery,
    },
    'assay.general.gpat 1': {
        runs: assayGpatRunData,
        emptyruns: {
            ...assayGpatRunData,
            rows: [],
            rowCount: 0,
        },
    },
    'assay.general.imagefieldassay': {
        runs: assayImageFieldRunsQuery,
    },
    core: {
        users: usersQuery,
    },
    exp: {
        samplesetheatmap: sampleSetHeatMapQuery,
        assaysheatmap: assaysHeatMapQuery,
        samplesets: sampleSetsQuery,
        dataclasses: dataClassesQuery,
        dataclasscategorytype: dataClassCategoryTypeQuery,
        runs: runsQuery,
    },
    'exp.data': {
        mixtures: mixturesQuery,
        mixturespaging: mixturesQueryPaging,
        expressionsystem: expSystemLineageQuery,
        'second source': secondSourceQuery,
        'source 1': source1Query,
    },
    labbook: {
        labbookexperiment: labbookQuery,
    },
    lists: {
        mixturetypes: mixtureTypesQuery,
        lookuplist: lookuplistQuery,
    },
    ontology: {
        ontologies: ontologiesQuery,
        getchildpaths: getOntologyChildPathsInfo,
        getalternateconceptpaths: getAlternateConceptPaths,
        getconceptparentpaths: getConceptParentPaths,
    },
    pipeline: {
        job: pipelineJobQuery,
    },
    samples: {
        hemoglobin: hemoglobinLineageQueryIn,
        samples: sampleDetailsQuery,
        expressionsystemsamples: expSystemSamplesLineageQuery,
        samplesetwithallfieldtypes: samplesLineageQuery,
        'name expression set': nameExpressionSelectedQuery,
        examples: sampleWithParentsQuery,
        multisource: sampleWithTwoSourcesQuery,
    },
    schema: {
        gridwithoutdata: noDataQuery,
    },
});

function jsonResponse(payload: any, res?: MockResponse): any {
    if (res) {
        return res.status(200).headers(JSON_HEADERS).body(JSON.stringify(payload));
    }

    return {
        status: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    };
}

function getSelections() {
    const selectionsStr = localStorage.getItem('__selections__');

    if (selectionsStr !== null) {
        return JSON.parse(selectionsStr);
    }

    return {};
}

function saveSelections(selections) {
    localStorage.setItem('__selections__', JSON.stringify(selections));
}

export function initMocks() {
    mock.setup();

    initQueryGridMocks(250);
    initLineageMocks();
    initUserPropsMocks();
    initDomainPropertiesMocks();
    initPipelineStatusDetailsMocks();
    initOnotologyMocks();

    mock.post(/.*\/query\/?.*\/executeSql.*/, (req, res) => {
        const body = decodeURIComponent(req.body());

        let responseBody;
        if (body.indexOf('"core"') > -1 && body.indexOf('FROM Principals') > -1) {
            responseBody = getPrincipalsJson;
        } else if (body.indexOf('"core"') > -1 && body.indexOf('FROM Members') > -1) {
            responseBody = getMembersJson;
        }

        if (!responseBody) {
            console.log(`executeSql response not found! "${body}"`);
        }

        return jsonResponse(responseBody, res);
    });

    mock.post(/.*\/query\/?.*\/updateRows.*/, (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;

        if (bodyParams.indexOf('"queryname":"samples"') > -1) {
            responseBody = samplesUpdate;
        }

        return jsonResponse(responseBody, res);
    });

    // TODO conditionalize based on queryName
    mock.post(/.*\/query\/?.*\/insertRows.*/, jsonResponse(samplesInsert));

    mock.get(/.*\/assay\/?.*\/getAssayTypeSelectOptions.*/, jsonResponse(getAssayDesignSectionOptions));

    mock.get(/.*ConfirmationData.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        const selectionKey = queryParams.dataRegionSelectionKey;
        if (selectionKey === 'deleteNone') {
            responseBody = deleteNoneConfirmation;
        } else if (selectionKey === 'deleteOne') {
            responseBody = deleteOneConfirmation;
        } else if (selectionKey === 'deleteSome') {
            responseBody = deleteSomeConfirmation;
        } else if (selectionKey === 'deleteAll') {
            responseBody = deleteAllConfirmation;
        }

        return jsonResponse(responseBody, res);
    });

    mock.post(/.*FileDuplicateCheck.*/, (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;

        if (bodyParams.indexOf('.csv') > -1 || bodyParams.indexOf('.tsv') > -1) {
            responseBody = assayFileDuplicateCheck;
        } else if (bodyParams.indexOf('.xls') > -1) {
            responseBody = assayFileNoDuplicateCheck;
        }

        return jsonResponse(responseBody, res);
    });

    mock.get(/.*getFilePreview.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.file === '1949' || queryParams.file === '2010') {
            responseBody = filePreviewData;
        }

        return jsonResponse(responseBody, res);
    });

    mock.post(/.*\/visualization\/?.*\/getVisualization.*/, jsonResponse(visualizationConfig));

    mock.post(/.*\/property\/?.*\/inferDomain.*/, jsonResponse(inferDomainJson));

    mock.get(/.*\/security\/?.*\/getRoles.*/, jsonResponse(getRolesJson));

    mock.get(/.*browseData.*/, delay(jsonResponse(browseData), 1000));

    mock.get(/.*getUserNotification.*/, jsonResponse(serverNotifications));

    mock.post(/.*getModules.*/, jsonResponse(getModulesInfo));

    mock.post(/.*getRegisteredProducts.*/, delay(jsonResponse(getRegisteredProductsInfo), 1000));

    mock.post(/.*getFolderTabs.*/, jsonResponse(getFolderTabsInfo));

    mock.get(/.*menuSections.*/, (req, res) => {
        const queryParams = req.url().query;

        let responseBody = getLKSMMenuSectionsInfo;
        if (queryParams.currentProductId === 'Biologics') {
            responseBody = getLKBMenuSectionsInfo;
        }

        return jsonResponse(responseBody, res);
    });

    mock.get(/.*getContainers.*/, jsonResponse(getProjectContainersInfo));

    mock.use(proxy);
}

export function initQueryGridMocks(delayMs = undefined) {
    let getQueryDetails = (req, res) => {
        const queryParams = req.url().query;
        const schemaName = queryParams.schemaName.toLowerCase();
        const queryName = queryParams.queryName.toLowerCase();
        const schema = QUERY_DETAILS_RESPONSES.get(schemaName);
        let responseBody;

        if (!schema) {
            responseBody = {
                exception: `Could not find the schema '${schemaName}' in the folder '/Biologics'!`,
                exceptionClass: 'org.labkey.api.view.NotFoundException',
            };
            return res.status(404).headers(JSON_HEADERS).body(JSON.stringify(responseBody));
        }

        responseBody = schema.get(queryName);

        if (!responseBody) {
            responseBody = {
                exception: `Could not find the query '${queryName}' in the schema '${schemaName}'!`,
                exceptionClass: 'org.labkey.api.view.NotFoundException',
            };
            return res.status(404).headers(JSON_HEADERS).body(JSON.stringify(responseBody));
        }

        return jsonResponse(responseBody, res);
    };

    let getQuery = (req, res) => {
        const params = decodeURIComponent(req.body())
            .split('&')
            .reduce((result, param) => {
                const [name, value] = param.split('=');
                result[name] = value;
                return result;
            }, {}) as any;
        const queryName = params['query.queryName'].toLowerCase();
        const schemaName = params.schemaName.toLowerCase();
        let responseBody;

        if (schemaName === 'samples' && queryName === 'hemoglobin') {
            if (params.hasOwnProperty('query.rowId~in')) {
                responseBody = hemoglobinLineageQueryIn;
            } else if (params.hasOwnProperty('query.RowId~eq')) {
                responseBody = hemoglobinLineageQueryEq;
            }
        } else if (
            schemaName === 'assay.general.amino acids' &&
            queryName === 'runs' &&
            params['query.viewName'] === '~~DETAILS~~'
        ) {
            responseBody = lineageRunDetail;
        } else if (queryName === 'mixturesbad') {
            return res
                .status(400)
                .headers(JSON_HEADERS)
                .body(JSON.stringify({ exception: 'Error loading rows' }));
        }

        if (!responseBody) {
            responseBody = QUERY_RESPONSES.getIn([schemaName, queryName]);

            if (!responseBody) {
                console.log(`getQuery response not found! schemaName: "${schemaName}" queryName: "${queryName}"`);
            }
        }

        let maxRows = params['query.maxRows'],
            offset = params['query.offset'] || 0;
        if (maxRows !== undefined) {
            maxRows = parseInt(maxRows);
            offset = parseInt(offset);
            responseBody = responseBody.set('rows', responseBody.get('rows').slice(offset, offset + maxRows));
        }

        return jsonResponse(responseBody, res);
    };

    let getSelected = (req, res) => {
        const body = JSON.parse(req.body());
        const key = body.key;
        let responseBody;

        if (key && key.toLowerCase() === 'sample-set-name%20expression%20set|samples/name%20expression%20set') {
            responseBody = nameExpressionSelected;
        } else {
            const selections = getSelections();
            responseBody = { selected: selections[key] ?? [] };
        }

        return jsonResponse(responseBody, res);
    };

    let selectDistinct = (req, res) => {
        const queryParams = req.url().query;
        const schemaName = queryParams.schemaName;
        const queryName = queryParams['query.queryName'];
        const column = queryParams['query.columns'];
        const responseBody = { schemaName, queryName, values: [] };
        const queryResponse = QUERY_RESPONSES.getIn([schemaName.toLowerCase(), queryName.toLowerCase()]);

        if (queryResponse) {
            const unique = new Set(
                queryResponse.get('rows').map(row => {
                    let data = row.getIn(['data', column]);
                    if (!data) {
                        data = row.getIn(['data', column.split('/')[0]]);
                    }
                    return data.get('displayValue') ?? data.get('value');
                })
            );
            responseBody.values = Array.from(unique);
        }

        return res.status(200).headers(JSON_HEADERS).body(JSON.stringify(responseBody));
    };

    if (delayMs !== undefined) {
        // We have to wrap like this instead of defaulting to 0 otherwise it breaks a lot of our tests :-(
        getQueryDetails = delay(getQueryDetails, delayMs);
        getQuery = delay(getQuery, delayMs);
        getSelected = delay(getSelected, delayMs);
        selectDistinct = delay(selectDistinct, delayMs);
    }

    mock.get(/.*\/query\/?.*\/getQueryDetails.*/, getQueryDetails);
    mock.post(/.*\/query\/?.*\/getQuery.*/, getQuery);
    mock.get(/.*\/query\/?.*\/selectDistinct.*/, selectDistinct);
    mock.post(/.*\/query\/?.*\/getSelected.*/, getSelected);

    mock.post(/.*\/query\/?.*\/setSelected.*/, (req, res) => {
        const params = decodeURIComponent(req.body())
            .split('&')
            .reduce((result, param) => {
                const [name, value] = param.split('=');

                if (result[name] === undefined) {
                    result[name] = [];
                }

                result[name].push(value);
                return result;
            }, {}) as any;
        const reqSelections = params.id;
        const queryParams = req.url().query;
        const { key, checked } = queryParams;
        const selections = getSelections();

        let currentSelections = new Set();

        if (selections[key] !== undefined) {
            currentSelections = new Set(selections[key]);
        }

        if (checked === 'true') {
            reqSelections.forEach(id => {
                currentSelections.add(id);
            });
        } else {
            reqSelections.forEach(id => {
                currentSelections.delete(id);
            });
        }

        selections[key] = Array.from(currentSelections);
        saveSelections(selections);
        const responseBody = { count: currentSelections.size };
        return jsonResponse(responseBody, res);
    });

    mock.post(/.*\/query\/?.*\/selectAll.*/, (req, res) => {
        const params = decodeURIComponent(req.body())
            .split('&')
            .reduce((result, param) => {
                const [name, value] = param.split('=');
                result[name] = value;
                return result;
            }, {}) as any;
        const key = params['query.selectionKey'];
        const { schemaName, queryName } = params;
        const queryResponse = QUERY_RESPONSES.getIn([schemaName, queryName]);
        const reqSelections = new Set();

        if (queryResponse) {
            queryResponse.get('rows').forEach(row => {
                reqSelections.add(row.getIn(['data', 'RowId', 'value']).toString());
            });
            const selections = getSelections();
            selections[key] = Array.from(reqSelections);
            saveSelections(selections);
        }

        const responseBody = { count: reqSelections.size };
        return jsonResponse(responseBody, res);
    });

    mock.post(/.*\/query\/?.*\/clearSelected.*/, (req, res) => {
        const body = JSON.parse(req.body());
        const key = body.key;
        const selections = getSelections();
        delete selections[key];
        saveSelections(selections);
        const responseBody = { count: 0 };
        return jsonResponse(responseBody, res);
    });

    // TODO conditionalize based on queryName
    mock.get(/.*\/study-reports\/?.*\/getReportInfos.*/, jsonResponse(mixturesReportInfos));
}

export function initDomainPropertiesMocks() {
    mock.get(/.*\/security\/?.*\/GetMaxPhiLevel.*/, jsonResponse(getMaxPhiLevelJson));

    mock.get(/.*\/assay\/?.*\/getValidPublishTargets.*/, jsonResponse(getValidPublishTargetsJson));

    mock.get(/.*\/query\/?.*\/getQueries.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.schemaName.toLowerCase() === 'assay') {
            responseBody = assayGetQueriesJson;
        }

        return jsonResponse(responseBody, res);
    });

    mock.get(/.*\/query\/?.*\/getSchemas.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.schemaName === undefined) {
            responseBody = getSchemasJson;
        } else if (queryParams.schemaName.toLowerCase() === 'assay') {
            responseBody = assayGetSchemasJson;
        }

        return jsonResponse(responseBody, res);
    });

    mock.get(/.*getProjectGroups.*/, (req, res) => {
        const responseBody = issuesProjectGroups;
        return jsonResponse(responseBody, res);
    });

    mock.get(/.*getUsersForGroup.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        if (queryParams.groupId === '') {
            responseBody = issuesUsersForGroup.filter(users => {
                return users.groupId === null;
            });
        } else if (queryParams.groupId === '-1' || queryParams.groupId === '-2' || queryParams.groupId === '1025') {
            responseBody = issuesUsersForGroup.filter(users => {
                return users.groupId !== null && users.groupId.toString() === queryParams.groupId;
            });
        }
        return jsonResponse(responseBody, res);
    });
}

export function initLineageMocks() {
    mock.get(/.*\/experiment\/?.*\/lineage.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody: any = lineageSampleData;

        if (queryParams.lsid && queryParams.lsid.indexOf('Run') > -1) {
            responseBody = lineageRunData;
        }

        return jsonResponse(responseBody, res);
    });
}

export function initUserPropsMocks(): void {
    // TODO conditionalize based on userId
    mock.get(/.*\/user\/getUserProps.*/, jsonResponse(userPropsInfo));
}

export function initServerNotificationMocks(): void {
    mock.get(/.*\/getUserNotification.*/, jsonResponse(serverNotifications));
}

export function initPipelineStatusDetailsMocks(): void {
    mock.get(/.*\/pipeline-status\/?.*\/statusDetails.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;

        responseBody = pipelineStatusDetails.filter(detail => {
            return detail.rowId == parseInt(queryParams.rowId);
        });

        return jsonResponse(responseBody.length > 0 ? responseBody[0] : { success: false }, res);
    });
}

export function initOnotologyMocks(): void {
    mock.get(/.*\/ontology\/?.*\/getOntology.*/, jsonResponse(getOntologyInfo));

    mock.get(/.*\/ontology\/?.*\/getChildPaths.*/, (req, res) => {
        const queryParams = req.url().query;

        if (queryParams.path === '/') {
            return jsonResponse(getOntologiesChildPathsInfo, res);
        }

        return jsonResponse(getOntologyChildPathsInfo, res);
    });

    mock.get(/.*\/ontology\/?.*\/getAlternateConceptPaths.*/, (req, res) => {
        return jsonResponse(getAlternateConceptPaths, res);
    });

    mock.get(/.*\/ontology\/?.*\/getConceptParentPaths.*/, (req, res) => {
        const queryParams = req.url().query;
        return jsonResponse(getConceptParentPaths, res);
    });

    mock.get(/.*\/ontology\/?.*\/getConcept.*/, (req, res) => {
        const queryParams = req.url().query;
        return jsonResponse(
            {
                success: true,
                concept: {
                    code: queryParams.code,
                    label: queryParams.code.split(':').join(' '),
                    description: 'This is the description for this concept.',
                    synonyms: [
                        'c987654321',
                        'code',
                        'synonym one',
                        'Max length label ipsum dolor sit amet, consectetur adipiscing elit. Aliquam porta metus nec lobortis. Aliquam erat volutpat. Vivamus cursus dui sit amet efficitur semper. Fusce vehicula sollicitudin volutpat. Cras auctor mi at tellus interdum aliquam. Morbi et faucibus turpis. Donec quis malesuada enim. Etiam scelerisque pharetra libero, blandit efficitur nisl varius mollis. Etiam orci nunc, aliquet ac hendrerit ac, porttitor in ex. Aenean placerat justo ut metus maximus ullamcorper. Morbi metus lorem, gravida eget massa in, finibus egestas erat. Suspendisse sollicitudin metus sapien, vitae dictum odio aliquam a. Ut euismod nisi ultricies condimentum luctus. Vestibulum tempor ultrices nunc.',
                    ],
                    url: null,
                },
            },
            res
        );
    });
}
