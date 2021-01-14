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

import { List } from 'immutable';

import { DOMAIN_FIELD_FULLY_LOCKED, DOMAIN_FIELD_PARTIALLY_LOCKED, DOMAIN_FIELD_PRIMARY_KEY_LOCKED } from './constants';
import { DomainDesign, DomainField } from './models';

// this is similar to what's in PropertiesEditorUtil.java that does the name validation in the old UI
export function isLegalName(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
        if (!isLegalNameChar(str.charAt(i), i == 0)) return false;
    }
    return true;
}

function isLegalNameChar(ch: string, first: boolean): boolean {
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') return true;
    if (first) return false;
    if (ch >= '0' && ch <= '9') return true;
    if (ch == ' ') return true;
    return false;
}

export function isFieldPartiallyLocked(lockType: string): boolean {
    // with partially locked can't change name and type, but can change other properties
    return lockType == DOMAIN_FIELD_PARTIALLY_LOCKED;
}

export function isFieldFullyLocked(lockType: string): boolean {
    // with fully locked, can't change any properties
    return lockType == DOMAIN_FIELD_FULLY_LOCKED;
}

export function isPrimaryKeyFieldLocked(lockType: string): boolean {
    // with PK locked, can't change type or required, but can change other properties
    return lockType == DOMAIN_FIELD_PRIMARY_KEY_LOCKED;
}

export function generateBulkDeleteWarning(deletabilityInfo, undeletableNames) {
    const { deletableSelectedFields, undeletableFields } = deletabilityInfo;
    const deletableCount = deletableSelectedFields.length;
    const undeletableCount = undeletableFields.length;

    const fields = deletableCount !== 1 ? 'fields' : 'field';
    const howManyDeleted =
        undeletableCount > 0
            ? `${deletableCount} of ${deletableCount + undeletableCount} fields`
            : `${deletableCount} ${fields}`;

    const itIsA = undeletableCount > 1 ? 'they are' : 'it is a';
    const field = undeletableCount > 1 ? 'fields' : 'field';
    const undeletableWarning =
        undeletableCount > 0 ? `${undeletableNames.join(', ')} cannot be deleted as ${itIsA} necessary ${field}.` : '';

    return { howManyDeleted, undeletableWarning };
}

export function applySetOperation(oldSet: Set<any>, value: any, add: boolean) {
    if (add) {
        return oldSet.add(value);
    } else {
        oldSet.delete(value);
        return oldSet;
    }
}

export function getVisibleSelectedFieldIndexes(fields: List<DomainField>): Set<number> {
    return fields.reduce((setOfIndexes, currentField, index) => {
        return currentField.visible && currentField.selected ? setOfIndexes.add(index) : setOfIndexes;
    }, new Set());
}

export function isFieldDeletable(field: DomainField): boolean {
    return (
        !isFieldFullyLocked(field.lockType) &&
        !isFieldPartiallyLocked(field.lockType) &&
        !isPrimaryKeyFieldLocked(field.lockType) &&
        !field.lockExistingField // existingField defaults to false. used for query metadata editor
    );
}

export function getVisibleFieldCount(domain: DomainDesign): number {
    return domain.fields.filter((field: DomainField) => field.visible).size;
}
