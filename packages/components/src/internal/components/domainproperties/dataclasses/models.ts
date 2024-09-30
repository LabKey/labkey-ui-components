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
import { immerable, produce } from 'immer';
import { Map, fromJS, OrderedMap } from 'immutable';

import { DomainDesign, IDomainField, SystemField } from '../models';

import { IImportAlias, IParentAlias } from '../../entities/models';

import { getDuplicateAlias, parentAliasInvalid } from '../utils';

import { DATACLASS_DOMAIN_SYSTEM_FIELDS, SOURCE_DOMAIN_SYSTEM_FIELDS } from './constants';

interface DataClassOptionsConfig {
    category: string;
    description: string;
    excludedContainerIds?: string[];
    importAliases?: Record<string, IImportAlias>;
    name: string;
    nameExpression: string;
    parentAliases?: OrderedMap<string, IParentAlias>;
    rowId: number;
    sampleSet: number;
    systemFields?: SystemField[];
}

export interface DataClassModelConfig extends DataClassOptionsConfig {
    domain: DomainDesign;
    exception: string;
}

export class DataClassModel implements DataClassModelConfig {
    [immerable] = true;

    readonly category: string;
    readonly description: string;
    readonly domain: DomainDesign;
    readonly exception: string;
    readonly name: string;
    readonly nameExpression: string;
    readonly rowId: number;
    readonly sampleSet: number;
    readonly systemFields: SystemField[];
    readonly parentAliases?: OrderedMap<string, IParentAlias>;
    readonly importAliases?: Record<string, IImportAlias>;
    readonly excludedContainerIds?: string[];
    readonly isBuiltIn?: boolean;

    constructor(values?: Partial<DataClassModelConfig>) {
        Object.assign(this, values);
    }

    static create(raw: any): DataClassModel {
        let domain = DomainDesign.create({});
        if (raw.domainDesign) {
            domain = DomainDesign.create(raw.domainDesign);
        }

        const model = new DataClassModel({ ...(raw.options ? raw.options : raw), domain });

        return produce<DataClassModel>(model, draft => {
            if (raw.options && model.category === null) {
                draft.category = undefined;
            }
            if (raw.options && model.sampleSet === null) {
                draft.sampleSet = undefined;
            }

            const aliases = raw.options?.importAliases || {};
            draft.importAliases = { ...aliases };

            draft.systemFields =
                model.category === 'sources' ? SOURCE_DOMAIN_SYSTEM_FIELDS : DATACLASS_DOMAIN_SYSTEM_FIELDS;
        });
    }

    get containerPath(): string {
        return this.domain?.container;
    }

    get isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        return (
            this.hasValidProperties &&
            !this.hasInvalidNameField(defaultNameFieldConfig) &&
            getDuplicateAlias(this.parentAliases, true).size === 0 &&
            !this.domain.hasInvalidFields()
        );
    }

    get hasValidProperties(): boolean {
        const hasInvalidAliases =
            this.parentAliases &&
            this.parentAliases.size > 0 &&
            this.parentAliases.find(parentAliasInvalid) !== undefined;

        return this.name !== undefined && this.name !== null && this.name.trim().length > 0 && !hasInvalidAliases;
    }

    hasInvalidNameField(defaultNameFieldConfig: Partial<IDomainField>): boolean {
        return this.domain && defaultNameFieldConfig ? this.domain.hasInvalidNameField(defaultNameFieldConfig) : false;
    }

    get entityDataMap(): Map<string, any> {
        return fromJS({
            rowId: this.rowId,
            name: this.name,
            description: this.description,
            nameExpression: this.nameExpression,
        });
    }

    get options(): DataClassOptionsConfig {
        return {
            rowId: this.rowId,
            name: this.name,
            description: this.description,
            excludedContainerIds: this.excludedContainerIds,
            nameExpression: this.nameExpression,
            category: this.category,
            sampleSet: this.sampleSet,
            systemFields: this.systemFields,
            importAliases: this.importAliases,
        };
    }

    mutate(props: Partial<DataClassModel>): DataClassModel {
        return produce<DataClassModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}
