/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { DefaultRenderer } from './DefaultRenderer';

export const ANCESTOR_LOOKUP_CONCEPT_URI = 'http://www.labkey.org/types#ancestorLookup';

interface Props {
    col?: any;
    data: Map<any, any>;
}

export const AncestorRenderer: FC<Props> = memo(({ data, col }) => {
    if (Map.isMap(data) && data.size > 0) {
        const { displayValue, value } = data.toJS();
        if (value < 0 && displayValue) {
            return (
                <span className="text-muted" title={`There are ${-value} ancestors of this type.`}>
                    {displayValue}
                </span>
            );
        }

        return <DefaultRenderer col={col} data={data} />;
    }

    return null;
});
