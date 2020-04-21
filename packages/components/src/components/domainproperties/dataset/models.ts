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

import { Record } from 'immutable';

import match from 'react-router/lib/match';
import { Option } from 'react-select';
import { getServerContext } from '@labkey/api';

import { DomainDesign } from '../models';

export interface DatasetAdvancedSettingsForm {
    datasetId?: number;
    cohortId?: number;
    tag?: string;
    showByDefault?: boolean;
    visitDatePropertyName?: string;
}

export class DatasetModel extends Record({
    domain: undefined,
    domainId: undefined,
    exception: undefined,
    datasetId: undefined,
    name: undefined,
    category: undefined,
    visitDatePropertyName: undefined,
    keyPropertyName: undefined,
    keyPropertyManaged: undefined,
    demographicData: undefined,
    label: undefined,
    cohortId: undefined,
    tag: undefined,
    showByDefault: undefined,
    description: undefined,
    dataSharing: undefined,
    definitionIsShared: undefined,
    sourceAssayName: undefined,
    sourceAssayUrl: undefined,
}) {
    domain: DomainDesign;
    domainId: number;
    exception: string;
    datasetId?: number;
    name: string;
    category?: string;
    visitDatePropertyName?: string;
    keyPropertyName?: string;
    keyPropertyManaged: boolean;
    demographicData: boolean;
    label?: string;
    cohortId?: number;
    tag?: string;
    showByDefault: boolean;
    description?: string;
    dataSharing?: string;
    definitionIsShared?: boolean;
    sourceAssayName?: string;
    sourceAssayUrl?: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(newDataset = null, raw: any): DatasetModel {
        if (newDataset) {
            const domain = DomainDesign.create(undefined);
            return new DatasetModel({ ...newDataset, domain });
        } else {
            const domain = DomainDesign.create(raw.domainDesign);
            return new DatasetModel({ ...raw.options, domain });
        }
    }

    hasValidProperties(): boolean {
        let isValidKeySetting = true;

        if (this.getDataRowSetting() === 2) {
            isValidKeySetting = this.keyPropertyName !== undefined && this.keyPropertyName !== '';
        }

        return (
            this.name !== undefined &&
            this.name !== null &&
            this.name.trim().length > 0 &&
            this.label !== undefined &&
            this.label !== null &&
            this.label.trim().length > 0 &&
            isValidKeySetting
        );
    }

    isNew(): boolean {
        return !this.datasetId;
    }

    getDataRowSetting(): number {
        let dataRowSetting;

        // participant id
        if ((this.keyPropertyName === undefined || this.keyPropertyName === null) && this.demographicData) {
            dataRowSetting = 0;
        }
        // participant id and timepoint
        else if (this.keyPropertyName === undefined || this.keyPropertyName === null) {
            dataRowSetting = 1;
        }
        // participant id, timepoint and additional key field
        else {
            dataRowSetting = 2;
        }

        return dataRowSetting;
    }

    validManagedKeyField(): boolean {
        if (this.keyPropertyName) {
            const domainFields = this.domain.fields;

            const allowedFieldTypes = domainFields
                .filter(field => {
                    return field.dataType.isString() || field.dataType.isInteger();
                })
                .map(field => {
                    return field.name;
                })
                .toList();

            return allowedFieldTypes.contains(this.keyPropertyName);
        } else {
            return false;
        }
    }

    getDomainKind(): string {
        if (getServerContext().moduleContext.study.timepointType === 'DATE') {
            return 'StudyDatasetDate';
        } else if (getServerContext().moduleContext.study.timepointType === 'VISIT') {
            return 'StudyDatasetVisit';
        }
        return undefined;
    }

    getOptions(): Record<string, any> {
        const options = this.toJS();

        delete options.exception;
        delete options.domain;
        return options;
    }

    isValid(): boolean {
        return this.hasValidProperties();
    }

    isFromAssay(): boolean {
        return this.sourceAssayName != null || this.sourceAssayName !== undefined;
    }
}
