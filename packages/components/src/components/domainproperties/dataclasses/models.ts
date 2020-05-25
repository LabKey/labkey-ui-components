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
import { Map, fromJS } from 'immutable';

import { DomainDesign, IDomainField } from '../models';

interface DataClassOptionsConfig {
    category: string;
    description: string;
    name: string;
    nameExpression: string;
    rowId: number;
    sampleSet: number;
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

    constructor(values?: Partial<DataClassModelConfig>) {
        Object.assign(this, values);
    }

    static create(raw: any): DataClassModel {
        let domain = DomainDesign.create({});
        if (raw.domainDesign) {
            domain = DomainDesign.create(raw.domainDesign);
        }

        if (raw.options) {
            const model = new DataClassModel({ ...raw.options, domain });
            return produce(model, (draft: Draft<DataClassModel>) => {
                if (model.category === null) {
                    draft.category = undefined;
                }
                if (model.sampleSet === null) {
                    draft.sampleSet = undefined;
                }
            });
        }

        return new DataClassModel({ ...raw, domain });
    }

    get isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        return (
            this.hasValidProperties &&
            !this.hasInvalidNameField(defaultNameFieldConfig) &&
            !this.domain.hasInValidFields()
        );
    }

    get hasValidProperties(): boolean {
        return this.name !== undefined && this.name !== null && this.name.trim().length > 0;
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
        };
    }
}
