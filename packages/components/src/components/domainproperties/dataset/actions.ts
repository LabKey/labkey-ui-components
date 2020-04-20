/*
 * Copyright (c) 2020 LabKey Corporation
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

import {
    COHORT_TIP,
    DATA_ROW_UNIQUENESS,
    DATASET_CATEGORY_TIP,
    DATASET_ID_TIP,
    DATASET_LABEL_TIP,
    DATASET_NAME_TIP, DATASPACE_TIP, TAG_TIP,
    VISIT_DATE_TIP
} from "./constants";
import {DatasetModel} from "./models";
import {ActionURL, Ajax, Domain, Utils} from "@labkey/api";
import {DomainDesign, selectRows} from "../../..";
import {fromJS, List} from "immutable";
import {Option} from "react-select";

export function fetchCategories(): Promise<List<Option>> {
    return new Promise((resolve, reject) => {
        selectRows({
            saveInSession: true,
            schemaName: 'study',
            sql: "SELECT DISTINCT CategoryId.Label, CategoryId.RowId FROM DataSets"
        }).then((data) => {
            const models = fromJS(data.models[data.key]);
            let categories = List<Option>();

            data.orderedModels[data.key].forEach((modelKey) => {
                const row = models.get(modelKey);
                const value = row.getIn(['Label', 'value']);
                const label = row.getIn(['Label', 'value']);

                categories = categories.push({value, label});
            });

            resolve(categories);
        }).catch((response) => {
            reject(response.message);
        });
    });
}

export function fetchVisitDateColumns(domain: DomainDesign): List<Option> {
    let visitDateColumns = List<Option>();

    visitDateColumns = visitDateColumns.push({value: 'date', label: 'date'});

    domain.fields.map((field, index) => {
        if (field.rangeURI.endsWith('dateTime')) {
            visitDateColumns = visitDateColumns.push({value: field.name, label: field.name})
        }
    });

    return visitDateColumns;
}

export function fetchCohorts(): Promise<List<Option>> {
    return new Promise((resolve, reject) => {
        selectRows({
            saveInSession: true,
            schemaName: 'study',
            queryName: 'Cohort'
        }).then((data) => {
            const models = fromJS(data.models[data.key]);
            let cohorts = List<Option>();

            data.orderedModels[data.key].forEach((modelKey) => {
                const row = models.get(modelKey);
                const value = row.getIn(['rowid', 'value']);
                const label = row.getIn(['label', 'value']);

                cohorts = cohorts.push({value, label});
            });

            resolve(cohorts);
        })
    });
}

export function getHelpTip (fieldName: string) : string {
    let helpTip = '';

    switch (fieldName) {
        case "name" :
            helpTip = DATASET_NAME_TIP;
            break;
        case "label" :
            helpTip = DATASET_LABEL_TIP;
            break;
        case "category" :
            helpTip = DATASET_CATEGORY_TIP;
            break;
        case "datasetId" :
            helpTip = DATASET_ID_TIP;
            break;
        case "visitDateColumn" :
            helpTip = VISIT_DATE_TIP;
            break;
        case "cohort" :
            helpTip = COHORT_TIP;
            break;
        case "tag" :
            helpTip = TAG_TIP;
            break;
        case "dataspace" :
            helpTip = DATASPACE_TIP;
            break;
        case "dataRowUniqueness" :
            helpTip = DATA_ROW_UNIQUENESS;
            break;

    }
    return helpTip;
}

export function getDatasetProperties(datasetId?: number) {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('study', 'GetDataset'),
            method: 'GET',
            params: {datasetId},
            scope: this,
            success: Utils.getCallbackWrapper((data) => {
                resolve(DatasetModel.create(data, undefined))
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error);
            })
        });
    })
}

export function fetchDatasetDesign(datasetId: number) : Promise<DatasetModel> {
    return new Promise((resolve, reject) => {
        getDatasetProperties(datasetId)
            .then((model: DatasetModel) => {
                Domain.getDomainDetails({
                    containerPath: LABKEY.container.path,
                    domainId: model.domainId,
                    success: (data) => {
                        resolve(DatasetModel.create(undefined, data));
                    },
                    failure: (error) => {
                        reject(error);
                    }
                });
            })
            .catch((error) => {
                reject(error);
            });
    });
}
