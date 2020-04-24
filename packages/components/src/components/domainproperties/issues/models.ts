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
import { Record } from "immutable";
import { DomainDesign, DomainField } from "../models";

export class IssuesModel extends Record({
    exception: undefined,
    domain: undefined,
    entityId : undefined,
    createdBy : undefined,
    created : undefined,
    modifiedBy : undefined,
    modified : undefined,
    containerId : undefined,
    domainId : undefined,
    name : undefined,
    singularItemName: undefined,
    pluralItemName: undefined,
    commentSortDirection: undefined,
    assignedToGroup: undefined,
    assignedToUser: undefined,
    domainKindName: undefined
}) {
    exception: string;
    domain: DomainDesign;
    name : string;
    singularItemName: string;
    pluralItemName: string;
    commentSortDirection: string;
    assignedToGroup: number;
    assignedToUser: number;
    domainId: number;
    domainKindName: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any, defaultSettings=null): IssuesModel {
        if (defaultSettings) {
            let domain = DomainDesign.create(undefined);
            return new IssuesModel({...defaultSettings, domain});
        } else {
            let domain = DomainDesign.create(raw.domainDesign);
            return new IssuesModel({...raw.options, domain});
        }
    }

    isNew(): boolean {
        return !this.domainId;
    }

    static isValid(model: IssuesModel): boolean {
        return model.hasValidProperties();
    }

    hasValidProperties(): boolean {
        return true; //TODO: when should it be valid or invalid
    }

    getOptions(): Object {
        let options = this.toJS();
        delete options.exception;
        delete options.domain;
        return options;
    }
}
