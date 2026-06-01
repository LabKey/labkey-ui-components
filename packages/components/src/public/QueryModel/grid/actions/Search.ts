/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { Action, ActionValue } from './Action';

export class SearchAction implements Action {
    isDefaultAction = true;
    iconCls = 'search';
    param = 'q';
    keyword = 'search';

    actionValueFromFilter(filter: Filter.IFilter, isReadOnly?: string): ActionValue {
        return {
            value: filter.getValue(),
            valueObject: filter,
            action: this,
            isReadOnly,
            isRemovable: true,
        };
    }
}
