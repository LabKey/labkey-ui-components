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
import { Record } from 'immutable';

import { DomainDesign, DomainField } from '../models';
import { DOMAIN_FIELD_PRIMARY_KEY_LOCKED } from '../constants';

export interface AdvancedSettingsForm {
    titleColumn?: string;
    discussionSetting?: number;
    fileAttachmentIndex?: boolean;
    entireListIndex?: boolean;
    entireListTitleTemplate?: string;
    entireListIndexSetting?: number;
    entireListBodySetting?: number;
    eachItemIndex?: boolean;
    eachItemTitleTemplate?: string;
    eachItemBodySetting?: number;
    entireListBodyTemplate?: string;
    eachItemBodyTemplate?: string;
}

export class ListModel extends Record({
    exception: undefined,
    domain: undefined,
    entityId: undefined,
    createdBy: undefined,
    created: undefined,
    modifiedBy: undefined,
    modified: undefined,
    containerId: undefined,
    name: undefined,
    description: undefined,
    lastIndexed: undefined,
    keyName: undefined,
    titleColumn: undefined,
    domainId: undefined,
    keyType: undefined,
    discussionSetting: undefined,
    allowDelete: undefined,
    allowUpload: undefined,
    allowExport: undefined,
    entireListIndex: undefined,
    entireListIndexSetting: undefined,
    entireListTitleTemplate: undefined,
    entireListBodySetting: undefined,
    entireListBodyTemplate: undefined,
    eachItemIndex: undefined,
    eachItemTitleTemplate: undefined,
    eachItemBodySetting: undefined,
    eachItemBodyTemplate: undefined,
    fileAttachmentIndex: undefined,
    listId: undefined,
    discussionSettingEnum: undefined,
    containerPath: undefined,
}) {
    exception: string;
    domain: DomainDesign;
    name: string;
    description: string;
    lastIndexed: any;
    keyName: string;
    titleColumn: null;
    domainId: number;
    keyType: string;
    discussionSetting: number;
    allowDelete: true;
    allowUpload: true;
    allowExport: true;
    entireListIndex: true;
    entireListIndexSetting: number;
    entireListTitleTemplate: string;
    entireListBodySetting: number;
    entireListBodyTemplate: string;
    eachItemIndex: false;
    eachItemTitleTemplate: string;
    eachItemBodySetting: number;
    eachItemBodyTemplate: string;
    fileAttachmentIndex: false;
    listId: number;
    discussionSettingEnum: string;
    containerPath: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(raw: any, defaultSettings = null): ListModel {
        if (defaultSettings) {
            const domain = DomainDesign.create(undefined);
            return new ListModel({ ...defaultSettings, domain });
        } else {
            let domain = DomainDesign.create(raw.domainDesign);

            // Issue39818: Set the key field of an existing list to be PKLocked.
            const fields = domain.fields;
            const pkField = fields.findIndex(i => i.isPrimaryKey);
            if (pkField > -1) {
                const pkFieldLocked = fields
                    .get(pkField)
                    .merge({ lockType: DOMAIN_FIELD_PRIMARY_KEY_LOCKED }) as DomainField;
                const updatedFields = fields.set(pkField, pkFieldLocked);
                domain = domain.set('fields', updatedFields) as DomainDesign;
            }

            return new ListModel({ ...raw.options, domain });
        }
    }

    getDomainKind(): string {
        if (this.keyType === 'Varchar') {
            return 'VarList';
        } else if (this.keyType === 'Integer' || this.keyType === 'AutoIncrementInteger') {
            return 'IntList';
        }

        return undefined;
    }

    hasValidKeyType(): boolean {
        return this.getDomainKind() !== undefined;
    }

    isNew(): boolean {
        return !this.listId;
    }

    isValid(): boolean {
        return this.hasValidProperties() && this.hasValidKeyType() && !this.domain.hasInvalidFields();
    }

    hasValidProperties(): boolean {
        return this.name !== undefined && this.name !== null && this.name.trim().length > 0;
    }

    getOptions(): Record<string, any> {
        const options = this.toJS();

        // Note: keyName is primarily set using <SetKeyFieldNamePanel/>'s onSelectionChange()
        // Setting keyName here covers the use-case where a user sets a Key Field, and then changes its name
        const keyField = this.domain.fields.find(field => field.isPrimaryKey);
        if (keyField && this.keyName !== keyField.name) {
            options.keyName = keyField.name;
        }

        delete options.exception;
        delete options.domain;
        return options;
    }
}
