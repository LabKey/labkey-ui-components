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
import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { DefaultRenderer } from './DefaultRenderer';

export const ANCESTOR_LOOKUP_CONCEPT_URI = 'http://www.labkey.org/types#ancestorLookup';

interface Props {
    data: Map<any, any>;
}

export const AncestorRenderer: FC<Props> = memo(({ data }) => {
    if (Map.isMap(data) && data.size > 0) {
        const { displayValue, value } = data.toJS();
        if (value < 0 && displayValue) {
            return (
                <span className="text-muted" title={`There are ${-value} ancestors of this type.`}>
                    {displayValue}
                </span>
            );
        }

        return <DefaultRenderer data={data} />;
    }

    return null;
});
