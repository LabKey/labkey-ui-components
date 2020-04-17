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
import { DomainDesign, IDomainField } from "../models";
import { getOrDefault } from "../../../QueryModel/utils";

export class DataClassModel {
    [immerable] = true;

    readonly rowId: number;
    readonly exception: string;
    readonly name: string;
    readonly nameExpression: string;
    readonly description: string;
    readonly sampleSet: number;
    readonly category: string;
    readonly domain: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        this.rowId = getOrDefault(values.rowId);
        this.exception = getOrDefault(values.exception);
        this.name = getOrDefault(values.name);
        this.nameExpression = getOrDefault(values.nameExpression);
        this.description = getOrDefault(values.description);
        this.sampleSet = getOrDefault(values.sampleSet);
        this.category = getOrDefault(values.category);
        this.domain = getOrDefault(values.domain);
    }

    static create(raw: any): DataClassModel {
        let domain = DomainDesign.create({});
        if (raw.domainDesign) {
            domain = DomainDesign.create(raw.domainDesign);
        }

        if (raw.options) {
            const model = new DataClassModel({...raw.options, domain});
            return produce(model, (draft: Draft<DataClassModel>) => {
                if (model.category === null) {
                    draft.category = undefined;
                }
                if (model.sampleSet === null) {
                    draft.sampleSet = undefined;
                }
            });
        }

        return new DataClassModel({...raw, domain});
    }

    get isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        return this.hasValidProperties && !this.hasInvalidNameField(defaultNameFieldConfig);
    }

    get hasValidProperties(): boolean {
        return (this.name !== undefined && this.name !==null && this.name.trim().length > 0);
    }

    hasInvalidNameField(defaultNameFieldConfig: Partial<IDomainField>): boolean {
        return (this.domain && defaultNameFieldConfig) ? this.domain.hasInvalidNameField(defaultNameFieldConfig) : false;
    }

    get entityDataMap(): Map<string, any> {
        return fromJS({
            rowId: this.rowId,
            name: this.name,
            description: this.description,
            nameExpression: this.nameExpression
        });
    }

    get options(): Object {
        return {
            rowId: this.rowId,
            name: this.name,
            description: this.description,
            nameExpression: this.nameExpression,
            category: this.category,
            sampleSet: this.sampleSet
        }
    }
}
