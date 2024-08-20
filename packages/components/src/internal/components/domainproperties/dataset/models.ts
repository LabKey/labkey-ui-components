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

import { immerable, produce } from 'immer';

import { DomainDesign, DomainField } from '../models';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../constants';

import { allowAsManagedField } from './utils';

export interface DatasetAdvancedSettingsForm {
    cohortId?: number;
    datasetId?: number;
    showByDefault?: boolean;
    tag?: string;
    visitDatePropertyName?: string;
}

export interface IDatasetModel {
    category?: string;
    cohortId?: number;
    dataSharing?: string;
    datasetId?: number;
    definitionIsShared?: boolean;
    demographicData: boolean;
    description?: string;
    domain: DomainDesign;
    domainId: number;
    entityId?: string;
    exception: string;
    keyPropertyManaged: boolean;
    keyPropertyName?: string;
    tag?: string;
    visitDatePropertyName?: string;
    showByDefault: boolean;
    sourceName?: string;
    sourceType?: string;
    name: string;
    sourceUrl?: string;
    label?: string;
    useTimeKeyField?: boolean;
}

export class DatasetModel implements IDatasetModel {
    [immerable] = true;

    readonly domain: DomainDesign;
    readonly domainId: number;
    readonly exception: string;
    readonly datasetId?: number;
    readonly entityId?: string;
    readonly name: string;
    readonly category?: string;
    readonly visitDatePropertyName?: string;
    readonly keyPropertyName?: string;
    readonly keyPropertyManaged: boolean;
    readonly demographicData: boolean;
    readonly label?: string;
    readonly cohortId?: number;
    readonly tag?: string;
    readonly showByDefault: boolean;
    readonly description?: string;
    readonly dataSharing?: string;
    readonly definitionIsShared?: boolean;
    readonly sourceName?: string;
    readonly sourceUrl?: string;
    readonly sourceType?: string;
    readonly useTimeKeyField?: boolean;

    constructor(datasetModel: IDatasetModel) {
        Object.assign(this, datasetModel);
    }

    static create(newDataset = null, raw?: any): DatasetModel {
        if (newDataset) {
            const domain = DomainDesign.create(undefined);
            return new DatasetModel({ ...newDataset, domain });
        } else {
            const domain = DomainDesign.create(raw.domainDesign);
            let model = new DatasetModel({ ...raw.options, domain });

            // if the dataset is from a linked source, disable/lock the fields
            if (model.isFromLinkedSource()) {
                const newDomain = domain.merge({
                    fields: domain.fields
                        .map((field: DomainField) => {
                            return field.set('lockType', DOMAIN_FIELD_FULLY_LOCKED);
                        })
                        .toList(),
                }) as DomainDesign;

                model = produce<DatasetModel>(model, draft => {
                    draft.domain = newDomain;
                });
            }

            return model;
        }
    }

    hasValidProperties(): boolean {
        const isValidName = this.name !== undefined && this.name !== null && this.name.trim().length > 0;
        const isValidLabel =
            this.isNew() || (this.label !== undefined && this.label !== null && this.label.trim().length > 0);

        return isValidName && isValidLabel && this.hasValidAdditionalKey();
    }

    hasValidAdditionalKey(): boolean {
        let isValidKeySetting = true;
        if (this.getDataRowSetting() === 2) {
            isValidKeySetting =
                (this.keyPropertyName !== undefined && this.keyPropertyName !== '') || this.useTimeKeyField;
        }

        return isValidKeySetting;
    }

    isNew(): boolean {
        return !this.entityId;
    }

    getDataRowSetting(): number {
        const noKeyPropName = this.keyPropertyName === undefined || this.keyPropertyName === null;

        // participant id
        if (noKeyPropName && this.demographicData) {
            return 0;
        }
        // participant id and timepoint
        else if (noKeyPropName && !this.useTimeKeyField) {
            return 1;
        }

        // participant id, timepoint and additional key field
        return 2;
    }

    validManagedKeyField(editedName?: string): boolean {
        if (this.keyPropertyName || editedName) {
            const domainFields = this.domain.fields;

            const allowedFieldTypes = domainFields
                .filter(field => allowAsManagedField(field))
                .map(field => {
                    return field.name;
                })
                .toList();

            return allowedFieldTypes.contains(this.keyPropertyName) || allowedFieldTypes.contains(editedName);
        } else {
            return false;
        }
    }

    getDomainKind(timepointType: string): string {
        return timepointType === 'VISIT' ? 'StudyDatasetVisit' : 'StudyDatasetDate';
    }

    getOptions(): Record<string, any> {
        return produce<IDatasetModel>(this, draft => {
            delete draft.exception;
            delete draft.domain;
        });
    }

    isValid(): boolean {
        return this.hasValidProperties() && !this.domain.hasInvalidFields();
    }

    isFromLinkedSource(): boolean {
        return this.sourceName !== undefined && this.sourceName !== null;
    }
}
