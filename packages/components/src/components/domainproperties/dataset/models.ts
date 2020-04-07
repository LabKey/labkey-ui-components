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

import {Record} from "immutable";
import {DomainDesign} from "../models";
import match from "react-router/lib/match";
import {Option} from "react-select";

export interface DatasetAdvancedSettingsForm {
    datasetId?: number;
    cohortId?: number;
    tag?: string;
    showInOverview?: boolean;
    visitDatePropertyName?: string;
}

export class DatasetModel extends Record({
    domain: undefined,
    exception: undefined,
    entityId : undefined,
    createdBy : undefined,
    created : undefined,
    modifiedBy : undefined,
    modified : undefined,
    containerId : undefined,
    datasetId: undefined,
    name: undefined,
    category: undefined,
    categoryId: undefined,
    visitDatePropertyName: undefined,
    keyPropertyId: undefined,
    keyPropertyManaged: undefined,
    isDemographicData: undefined,
    label: undefined,
    cohortId: undefined,
    tag: undefined,
    showInOverview: undefined,
    description: undefined,
    dataSharing: undefined
}) {
    domain: DomainDesign;
    exception: string;
    datasetId?: number;
    entityId: string;
    name: string;
    category?: string;
    categoryId?: number;
    visitDatePropertyName?: string;
    keyPropertyId?: number;
    keyPropertyManaged: boolean;
    isDemographicData: boolean;
    label?: string;
    cohortId?: number;
    tag?: string;
    showInOverview: boolean;
    description?: string;
    dataSharing?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(newDataset=null, raw: any): DatasetModel {
        if (newDataset) {
            let domain = DomainDesign.create(undefined);
            return new DatasetModel({...newDataset, domain});
        } else {
            let domain = DomainDesign.create(raw.domainDesign);
            return new DatasetModel({...raw.datasetDesign, domain});
        }
    }

    hasValidProperties(): boolean {
        let isValidKeySetting = true;

        if (this.getDataRowSetting() === 2) {
            isValidKeySetting = this.keyPropertyId !== undefined && this.keyPropertyId !== 0
        }

        return this.name !== undefined && this.name !== null && this.name.trim().length > 0 && isValidKeySetting;
    }

    isNew(): boolean {
        return !this.entityId;
    }

    getDataRowSetting() : number {
        let dataRowSetting;

        // participant id
        if ((this.keyPropertyId === undefined || this.keyPropertyId === null) && this.isDemographicData) {
            dataRowSetting = 0;
        }
        // participant id and timepoint
        else if (this.keyPropertyId === undefined || this.keyPropertyId === null) {
            dataRowSetting = 1;
        }
        // participant id, timepoint and additional key field
        else {
            dataRowSetting = 2;
        }

        return dataRowSetting;
    }

    validManagedKeyField(): boolean {

        if (this.keyPropertyId) {
            const domainFields = this.domain.fields;

            const allowedFieldTypes = domainFields.filter((field) => {
                return field.dataType.isString() || field.dataType.isInteger()
            })
                .map((field) => {
                    return field.propertyId
                })
                .toList();

            return allowedFieldTypes.contains(this.keyPropertyId);
        }
        else {
            return false;
        }

    }
}
