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
import { immerable } from 'immer';

import { DomainDesign } from '../models';

export interface IssuesListDefOptionsConfig {
    entityId?: string;
    issueDefName: string;
    singularItemName: string;
    pluralItemName: string;
    commentSortDirection: string;
    assignedToGroup: number;
    assignedToUser: number;
}

interface IssuesListDefModelConfig extends IssuesListDefOptionsConfig {
    exception: string;
    domain: DomainDesign;
    domainId: number;
    domainKindName: string;
}

export class IssuesListDefModel implements IssuesListDefModelConfig {
    [immerable] = true;

    readonly exception: string;
    readonly domain: DomainDesign;
    readonly entityId?: string;
    readonly domainId: number;
    readonly issueDefName: string;
    readonly singularItemName: string = 'Issue';
    readonly pluralItemName: string = 'Issues';
    readonly commentSortDirection: string = 'ASC';
    readonly assignedToGroup: number;
    readonly assignedToUser: number;
    readonly domainKindName: string;

    constructor(values?: Partial<IssuesListDefModelConfig>) {
        Object.assign(this, values);
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

    isValid(): boolean {
        return this.hasValidProperties() && !this.domain.hasInvalidFields();
    }

    hasValidProperties(): boolean {
        return this.issueDefName !== undefined && this.issueDefName !== null && this.issueDefName.trim().length > 0;
    }

    getOptions(): IssuesListDefOptionsConfig {
        return {
            entityId: this.entityId,
            issueDefName: this.issueDefName,
            singularItemName: this.singularItemName,
            pluralItemName: this.pluralItemName,
            commentSortDirection: this.commentSortDirection,
            assignedToGroup: this.assignedToGroup,
            assignedToUser: this.assignedToUser,
        };
    }
}
