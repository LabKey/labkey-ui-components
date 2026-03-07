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
import { ActionURL, Domain } from '@labkey/api';

import { List } from 'immutable';

import { SelectInputOption } from '../../forms/input/SelectInput';
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
    VISIT_TIMEPOINT_TYPE,
} from './constants';
import { DatasetModel } from './models';
import { StudyProperties } from './utils';
import { executeSql } from '../../../query/executeSql';
import { SCHEMAS } from '../../../schemas';
import { selectRows } from '../../../query/selectRows';
import { caseInsensitive } from '../../../util/utils';
import { request } from '../../../request';

export async function fetchCategories(): Promise<SelectInputOption[]> {
    const result = await executeSql({
        schemaName: SCHEMAS.STUDY_TABLES.SCHEMA,
        sql: 'SELECT DISTINCT CategoryId.Label, CategoryId.RowId FROM DataSets',
    });

    return result.rows.reduce<SelectInputOption[]>((option, row) => {
        const label = row.Label.value;
        // TODO: Seems odd that we are fetching the rowId but not using it as the value
        option.push({ label, value: label });
        return option;
    }, []);
}

export function getVisitDateColumns(domain: DomainDesign): List<SelectInputOption> {
    let visitDateColumns = List<SelectInputOption>();

    // date field is a built-in field for a dataset for a date based study
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
    if (timepointType !== VISIT_TIMEPOINT_TYPE) {
        additionalKeyFields = additionalKeyFields.push({ value: TIME_KEY_FIELD_KEY, label: TIME_KEY_FIELD_DISPLAY });
    }

    domain.fields
        .filter(field => !field.isCalculatedField() && !field.isMultiChoiceField())
        .map(field => {
            additionalKeyFields = additionalKeyFields.push({ value: field.name, label: field.name });
        });

    return additionalKeyFields;
}

export async function fetchCohorts(): Promise<SelectInputOption[]> {
    const results = await selectRows({
        columns: ['Label', 'RowId'],
        schemaQuery: SCHEMAS.STUDY_TABLES.COHORT,
    });

    return results.rows.map(row => ({
        label: caseInsensitive(row, 'Label').value,
        value: caseInsensitive(row, 'RowId').value,
    }));
}

export function getHelpTip(fieldName: string, studyProperties: StudyProperties): string {
    let helpTip = '';

    switch (fieldName) {
        case 'category':
            helpTip = DATASET_CATEGORY_TIP;
            break;
        case 'cohort':
            helpTip = COHORT_TIP;
            break;
        case 'dataRowUniqueness':
            helpTip =
                'Choose criteria for how ' +
                studyProperties.SubjectNounPlural.toLowerCase() +
                ' and visits/timepoints are paired with, or without, an additional data column.';
            break;
        case 'datasetId':
            helpTip = DATASET_ID_TIP;
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
        case 'label':
            helpTip = DATASET_LABEL_TIP;
            break;
        case 'name':
            helpTip = DATASET_NAME_TIP;
            break;
        case 'tag':
            helpTip = TAG_TIP;
            break;
        case 'visitDateColumn':
            helpTip = VISIT_DATE_TIP;
            break;
    }
    return helpTip;
}

async function getDatasetProperties(datasetId?: number): Promise<DatasetModel> {
    const result = await request({
        url: ActionURL.buildURL('study', 'getDataset.api'),
        params: { datasetId },
        errorLogMsg: 'Failed to load dataset properties',
    });

    return DatasetModel.create(result);
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
