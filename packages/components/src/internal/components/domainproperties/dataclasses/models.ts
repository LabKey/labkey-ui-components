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
import { Draft, immerable, produce } from 'immer';
import {Map, fromJS, OrderedMap, Set} from 'immutable';

import {DomainDesign, IDomainField, SystemField} from '../models';

import { DATACLASS_DOMAIN_SYSTEM_FIELDS, SOURCE_DOMAIN_SYSTEM_FIELDS } from './constants';
import {IParentAlias} from "../../entities/models";

interface DataClassOptionsConfig {
    category: string;
    description: string;
    name: string;
    nameExpression: string;
    rowId: number;
    sampleSet: number;
    systemFields?: SystemField[];
    parentAliases?: OrderedMap<string, IParentAlias>;
    importAliases?: Map<string, string>;
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
    readonly importAliases?: Map<string, string>;
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

        return produce(model, (draft: Draft<DataClassModel>) => {
            if (raw.options && model.category === null) {
                draft.category = undefined;
            }
            if (raw.options && model.sampleSet === null) {
                draft.sampleSet = undefined;
            }

            const aliases = raw.options?.importAliases || {};
            draft.importAliases = Map<string, string>(fromJS(aliases));

            draft.systemFields = model.category === "sources" ? SOURCE_DOMAIN_SYSTEM_FIELDS : DATACLASS_DOMAIN_SYSTEM_FIELDS;
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
            !this.domain.hasInvalidFields()
        );
    }

    parentAliasInvalid(alias: Partial<IParentAlias>): boolean {
        if (!alias) return true;

        const aliasValueInvalid = !alias.alias || alias.alias.trim() === '';
        const parentValueInvalid = !alias.parentValue || !alias.parentValue.value;

        return !!(aliasValueInvalid || parentValueInvalid || alias.isDupe);
    }

    getDuplicateAlias(returnAliases = false): Set<string> {
        const { parentAliases } = this;
        let uniqueAliases = Set<string>();
        let dupeAliases = Set<string>();
        let dupeIds = Set<string>();

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                if (uniqueAliases.has(alias.alias)) {
                    dupeIds = dupeIds.add(alias.id);
                    dupeAliases = dupeAliases.add(alias.alias);
                } else {
                    uniqueAliases = uniqueAliases.add(alias.alias);
                }
            });
        }

        return returnAliases ? dupeAliases : dupeIds;
    }

    get hasValidProperties(): boolean {
        const hasInvalidAliases =
            this.parentAliases && this.parentAliases.size > 0 && this.parentAliases.find(this.parentAliasInvalid) !== undefined;

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
            nameExpression: this.nameExpression,
            category: this.category,
            sampleSet: this.sampleSet,
            systemFields: this.systemFields,
        };
    }

    mutate(props: Partial<DataClassModel>): DataClassModel {
        return produce<DataClassModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}
