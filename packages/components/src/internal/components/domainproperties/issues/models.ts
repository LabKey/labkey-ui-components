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

import { Record } from 'immutable';

import { DomainDesign } from '../models';

export interface IssuesListDefOptionsConfig {
    assignedToGroup: number;
    assignedToUser: number;
    commentSortDirection: string;
    entityId?: string;
    issueDefName: string;
    pluralItemName: string;
    relatedFolderName: string;
    restrictedIssueList: boolean;
    restrictedIssueListGroup: number;
    singularItemName: string;
}

interface IssuesListDefModelConfig extends IssuesListDefOptionsConfig {
    domain: DomainDesign;
    domainId: number;
    domainKindName: string;
    exception: string;
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
    readonly relatedFolderName: string;
    readonly restrictedIssueList: boolean;
    readonly restrictedIssueListGroup: number;

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
            relatedFolderName: this.relatedFolderName,
            restrictedIssueList: this.restrictedIssueList,
            restrictedIssueListGroup: this.restrictedIssueListGroup,
        };
    }
}

export class IssuesRelatedFolder extends Record({
    issueDefName: undefined,
    displayName: undefined,
    containerPath: undefined,
    key: undefined,
}) {
    declare issueDefName: string;
    declare displayName: string;
    declare containerPath: string;
    declare key: string;

    static create(raw: any): IssuesRelatedFolder {
        return new IssuesRelatedFolder({ ...raw });
    }
}
