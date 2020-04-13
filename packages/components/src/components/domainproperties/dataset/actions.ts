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

export const fetchCategories = async () => {
    // TODO: Replace this with server side call
    return {
        'categories': [
            {label: 'A', value: 20},
            {label: 'B', value: 21},
            {label: 'C', value: 22}]
    };
};

export const fetchCohorts = async () => {
    // TODO: Replace this with server side call
    return {
        'cohorts': [
            {label: 'Cohort1', value: 1},
            {label: 'Cohort2', value: 2},
            {label: 'Cohort3', value: 3}]
    };
};


export const fetchVisitDateColumns = async () => {
    // TODO: Keeping this action until next story in which visitDateColumns will be pulled from state change (for date fields) in the Domain Form.
    return {
        'visitDateColumns': [
            {label: 'Date', value: 'date'},
            {label: 'Arrival Date', value: 'arrivalDate'}]
    };
};

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
                    domainId: model.domain.domainId,
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
