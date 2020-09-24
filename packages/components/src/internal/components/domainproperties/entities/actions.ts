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
import { Map } from 'immutable';

import { IEntityDetails } from './models';
import { ENTITY_FORM_ID_PREFIX, ENTITY_FORM_IDS } from './constants';

export function getFormNameFromId(id: string): string {
    const index = id.indexOf(ENTITY_FORM_ID_PREFIX);
    return index === 0 ? id.substring(index + ENTITY_FORM_ID_PREFIX.length) : id;
}

function getEntityFormDataValue(
    key: string,
    propName: string,
    defaultValue: any,
    formValues: IEntityDetails,
    data: Map<string, any>
): any {
    if (key && formValues && formValues[key] !== undefined) {
        return formValues[key] || defaultValue;
    } else if (data) {
        return data.get(propName) || defaultValue;
    }

    return defaultValue;
}

export function isEntityFormValid(formValues: IEntityDetails, data: Map<string, any>): boolean {
    const hasValidName =
        formValues !== undefined &&
        formValues[ENTITY_FORM_IDS.NAME] !== undefined &&
        formValues[ENTITY_FORM_IDS.NAME].length > 0;
    return isExistingEntity(formValues, data) || hasValidName;
}

export function isExistingEntity(formValues: IEntityDetails, data: Map<string, any>): boolean {
    return getEntityFormDataValue(null, 'rowId', undefined, formValues, data) !== undefined;
}

export function getEntityNameValue(formValues: IEntityDetails, data: Map<string, any>): string {
    return getEntityFormDataValue(ENTITY_FORM_IDS.NAME, 'name', '', formValues, data);
}

export function getEntityNameExpressionValue(formValues: IEntityDetails, data: Map<string, any>): string {
    return getEntityFormDataValue(ENTITY_FORM_IDS.NAME_EXPRESSION, 'nameExpression', '', formValues, data);
}

export function getEntityDescriptionValue(formValues: IEntityDetails, data: Map<string, any>): string {
    return getEntityFormDataValue(ENTITY_FORM_IDS.DESCRIPTION, 'description', '', formValues, data);
}
