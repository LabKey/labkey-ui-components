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
import {Draft, immerable, produce} from 'immer';
import { DomainDesign } from '../models';
import { Record } from 'immutable';

export class IssuesListDefModel {
    [immerable] = true;

    readonly exception: string;
    readonly domain: DomainDesign;
    readonly entityId?: string;
    readonly domainId: number;
    readonly name: string;
    readonly singularItemName?: string;
    readonly pluralItemName?: string;
    readonly commentSortDirection?: string = "ASC";
    readonly assignedToGroup: number;
    readonly assignedToUser: number;
    readonly domainKindName: string;

    constructor(issuesListDefModel : IssuesListDefModel) {
        Object.assign(this, issuesListDefModel)
    }

    static create(raw: any, defaultSettings = null): IssuesListDefModel {
        if (defaultSettings) {
            const domain = DomainDesign.create(undefined);
            return new IssuesListDefModel({ ...defaultSettings, domain });
        } else {
            const domain = DomainDesign.create(raw.domainDesign);
            return new IssuesListDefModel({ ...raw.options, domain });
        }
    }

    isNew(): boolean {
        return !this.entityId;
    }

    static isValid(model: IssuesListDefModel): boolean {
        return model.hasValidProperties();
    }

    hasValidProperties(): boolean {
        return this.name !== undefined && this.name !== null && this.name.trim().length > 0;
    }

    getOptions(): Record<string, any> {
        return produce(this, (draft: Draft<IssuesListDefModel>) => {
            delete draft.exception;
            delete draft.domain;
        });
    }
}
