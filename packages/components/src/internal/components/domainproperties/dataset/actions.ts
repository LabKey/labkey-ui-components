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

import { ActionURL, Ajax, Domain, Utils } from '@labkey/api';

import { fromJS, List } from 'immutable';

import { SelectInputOption } from '../../forms/input/SelectInput';
import { selectRowsDeprecated } from '../../../query/api';
import { DomainDesign } from '../models';

import {
    COHORT_TIP,
    DATASET_CATEGORY_TIP,
    DATASET_ID_TIP,
    DATASET_LABEL_TIP,
    DATASET_NAME_TIP,
    TAG_TIP,
    TIME_KEY_FIELD_DISPLAY,
    TIME_KEY_FIELD_KEY,
    VISIT_DATE_TIP,
} from './constants';
import { DatasetModel } from './models';
import {StudyProperties} from "./utils";

export function fetchCategories(): Promise<List<SelectInputOption>> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            saveInSession: true,
            schemaName: 'study',
            sql: 'SELECT DISTINCT CategoryId.Label, CategoryId.RowId FROM DataSets',
        })
            .then(data => {
                const models = fromJS(data.models[data.key]);
                let categories = List<SelectInputOption>();

                data.orderedModels[data.key].forEach(modelKey => {
                    const row = models.get(modelKey);
                    const value = row.getIn(['Label', 'value']);
                    const label = row.getIn(['Label', 'value']);

                    categories = categories.push({ value, label });
                });

                resolve(categories);
            })
            .catch(response => {
                reject(response.message);
            });
    });
}

export function getVisitDateColumns(domain: DomainDesign): List<SelectInputOption> {
    let visitDateColumns = List<SelectInputOption>();

    // date field is a built in field for a dataset for a date based study
    visitDateColumns = visitDateColumns.push({ value: 'date', label: 'date' });

    domain.fields.map(field => {
        if (field && field.rangeURI && field.rangeURI.endsWith('dateTime')) {
            visitDateColumns = visitDateColumns.push({ value: field.name, label: field.name });
        }
    });

    return visitDateColumns;
}

export function getAdditionalKeyFields(domain: DomainDesign, timepointType: string): List<SelectInputOption> {
    let additionalKeyFields = List<SelectInputOption>();

    // In a date-based or continuous study, an additional third key option is to use the Time (from Date/Time) portion of a datestamp field
    // where multiple measurements happen on a given day or visit (tracking primate weight for example), the time portion of the date field can be used as an additional key
    if (timepointType !== 'VISIT') {
        additionalKeyFields = additionalKeyFields.push({ value: TIME_KEY_FIELD_KEY, label: TIME_KEY_FIELD_DISPLAY });
    }

    domain.fields
        .filter(field => !field.isCalculatedField())
        .map(field => {
            additionalKeyFields = additionalKeyFields.push({ value: field.name, label: field.name });
        });

    return additionalKeyFields;
}

export function fetchCohorts(): Promise<List<SelectInputOption>> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: 'study',
            queryName: 'Cohort',
        })
            .then(data => {
                const models = fromJS(data.models[data.key]);
                let cohorts = List<SelectInputOption>();

                data.orderedModels[data.key].forEach(modelKey => {
                    const row = models.get(modelKey);
                    const value = row.getIn(['rowid', 'value']);
                    const label = row.getIn(['label', 'value']);

                    cohorts = cohorts.push({ value, label });
                });

                resolve(cohorts);
            })
            .catch(response => {
                reject(response.message);
            });
    });
}

export function getHelpTip(fieldName: string, studyProperties: StudyProperties): string {
    let helpTip = '';

    switch (fieldName) {
        case 'name':
            helpTip = DATASET_NAME_TIP;
            break;
        case 'label':
            helpTip = DATASET_LABEL_TIP;
            break;
        case 'category':
            helpTip = DATASET_CATEGORY_TIP;
            break;
        case 'datasetId':
            helpTip = DATASET_ID_TIP;
            break;
        case 'visitDateColumn':
            helpTip = VISIT_DATE_TIP;
            break;
        case 'cohort':
            helpTip = COHORT_TIP;
            break;
        case 'tag':
            helpTip = TAG_TIP;
            break;
        case 'dataspace':
            helpTip =
                'For demographics datasets, this setting is used to enable data sharing across studies. ' +
                "When 'No' is selected (default), each study folder 'owns' its own data rows. If the study has shared " +
                "visits/timepoints, then 'Share by " +
                studyProperties.SubjectColumnName +
                "' means that data rows are shared across the project and " +
                'studies will only see data rows for ' +
                studyProperties.SubjectNounPlural.toLowerCase() +
                ' that are part of that study.';
            break;
        case 'dataRowUniqueness':
            helpTip =
                'Choose criteria for how ' +
                studyProperties.SubjectNounPlural.toLowerCase() +
                ' and visits/timepoints are paired with, or without, an additional data column.';
            break;
    }
    return helpTip;
}

function getDatasetProperties(datasetId?: number): Promise<DatasetModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('study', 'getDataset.api'),
            method: 'GET',
            params: { datasetId },
            success: Utils.getCallbackWrapper(data => {
                resolve(DatasetModel.create(data, undefined));
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function fetchDatasetDesign(datasetId?: number): Promise<DatasetModel> {
    return new Promise((resolve, reject) => {
        getDatasetProperties(datasetId)
            .then((model: DatasetModel) => {
                Domain.getDomainDetails({
                    domainId: model.domainId,
                    domainKind: datasetId === undefined ? 'StudyDatasetDate' : undefined, // NOTE there is also a StudyDatasetVisit domain kind but for this purpose either will work
                    success: data => {
                        resolve(DatasetModel.create(undefined, data));
                    },
                    failure: error => {
                        reject(error);
                    },
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}
