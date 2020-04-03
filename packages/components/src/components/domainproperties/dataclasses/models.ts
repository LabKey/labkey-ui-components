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
import { Record } from "immutable";
import { DomainDesign, IDomainField } from "../models";

export class DataClassModel extends Record({
    rowId: undefined,
    exception: undefined,
    name: undefined,
    nameExpression: undefined,
    description: undefined,
    sampleSet: undefined,
    category: undefined,
    domain: undefined
}) {
    rowId: number;
    exception: string;
    name: string;
    nameExpression: string;
    description: string;
    sampleSet: number;
    category: string;
    domain: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any): DataClassModel {
        let domain = DomainDesign.create({});
        if (raw.domainDesign) {
            domain = DomainDesign.create(raw.domainDesign);
        }

        if (raw.options) {
            let model = new DataClassModel({...raw.options, domain});
            if (model.category === null) {
                model = model.set('category', undefined) as DataClassModel;
            }
            if (model.sampleSet === null) {
                model = model.set('sampleSet', undefined) as DataClassModel;
            }
            return model;
        }

        return new DataClassModel({...raw, domain});
    }

    isNew(): boolean {
        return !this.rowId;
    }

    static isValid(model: DataClassModel, defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        return model.hasValidProperties() && !model.hasInvalidNameField(defaultNameFieldConfig);
    }

    hasValidProperties(): boolean {
        return (this.name !== undefined && this.name !==null && this.name.trim().length > 0);
    }

    hasInvalidNameField(defaultNameFieldConfig: Partial<IDomainField>): boolean {
        return (this.domain && defaultNameFieldConfig) ? this.domain.hasInvalidNameField(defaultNameFieldConfig) : false;
    }

    getOptions(): Object {
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
