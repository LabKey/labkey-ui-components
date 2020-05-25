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

import { getServerContext } from '@labkey/api';

import { Draft, immerable, produce } from 'immer';

import { DomainDesign, DomainField } from '../models';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../constants';

import { allowAsManagedField } from './actions';

export interface DatasetAdvancedSettingsForm {
    datasetId?: number;
    cohortId?: number;
    tag?: string;
    showByDefault?: boolean;
    visitDatePropertyName?: string;
}

export interface IDatasetModel {
    domain: DomainDesign;
    domainId: number;
    exception: string;
    datasetId?: number;
    entityId?: string;
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
    readonly sourceAssayName?: string;
    readonly sourceAssayUrl?: string;
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

            // if the dataset is from an assay source, disable/lock the fields
            if (model.isFromAssay()) {
                const newDomain = domain.merge({
                    fields: domain.fields
                        .map((field: DomainField) => {
                            return field.set('lockType', DOMAIN_FIELD_FULLY_LOCKED);
                        })
                        .toList(),
                }) as DomainDesign;

                model = produce(model, (draft: Draft<DatasetModel>) => {
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

        let isValidKeySetting = true;
        if (this.getDataRowSetting() === 2) {
            isValidKeySetting =
                (this.keyPropertyName !== undefined && this.keyPropertyName !== '') || this.useTimeKeyField;
        }

        return isValidName && isValidLabel && isValidKeySetting;
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

    getDomainKind(): string {
        return getServerContext().moduleContext.study.timepointType === 'VISIT'
            ? 'StudyDatasetVisit'
            : 'StudyDatasetDate';
    }

    getOptions(): Record<string, any> {
        return produce(this, (draft: Draft<IDatasetModel>) => {
            delete draft.exception;
            delete draft.domain;
        });
    }

    isValid(): boolean {
        return this.hasValidProperties();
    }

    isFromAssay(): boolean {
        return this.sourceAssayName !== undefined && this.sourceAssayName !== null;
    }
}
