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
import { IEntityDetails } from '../entities/models';
import { Record } from "immutable";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import { DomainDesign } from "../models";

export interface IDataClassProperties extends IEntityDetails {
    materialSourceId?: number
}

export class DataClassModel extends Record({
    rowId: undefined,
    name: undefined,
    nameExpression: undefined,
    description: undefined,
    materialSourceId: undefined,
    domain: undefined
}) {
    rowId: number;
    name: string;
    nameExpression: string;
    description: string;
    materialSourceId: number;
    domain: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any): DataClassModel {
        let domain = DomainDesign.create({});
        if (raw.domainDesign) {
            domain = DomainDesign.create(raw.domainDesign);
        }

        return new DataClassModel({...raw, domain});
    }

    static serialize(model: DataClassModel): any {
        // need to serialize the DomainDesign object to remove the unrecognized fields
        const domain = DomainDesign.serialize(model.domain);

        let json = model.merge({domain}).toJS();

        // TODO anything needed here, otherwise remove
        // delete json.autoCopyTargetContainer;
        // delete json.exception;

        return json;
    }

    isNew(): boolean {
        return !this.rowId;
    }

    static isValid(model: DataClassModel): boolean {
        const errDomain = !!model.domain.domainException && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR;
        return !errDomain && model.hasValidProperties();
    }

    hasValidProperties(): boolean {
        return (this.name !== undefined && this.name !==null && this.name.trim().length > 0);
    }
}
