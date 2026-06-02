/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { decodePart } from '../../../SchemaQuery';
import { QuerySort } from '../../../QuerySort';

import { Action, ActionValue } from './Action';

export class SortAction implements Action {
    iconCls = 'sort';
    keyword = 'sort';
    separator = ',';

    actionValueFromSort(sort: QuerySort, label: string): ActionValue {
        const { dir, fieldKey } = sort;
        return {
            value: `${fieldKey} ${dir === '-' ? 'DESC' : 'ASC'}`,
            displayValue: label ?? decodePart(fieldKey),
            valueObject: sort,
            action: this,
        };
    }
}
