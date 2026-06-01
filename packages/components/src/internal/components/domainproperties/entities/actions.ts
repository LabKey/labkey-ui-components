/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
