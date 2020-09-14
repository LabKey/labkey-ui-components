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
import React, { ReactNode } from 'react';
import { List } from 'immutable';

import { MultiValueRenderer } from './MultiValueRenderer';

/**
 * This is the default cell renderer for Details/Grids using a QueryGridModel.
 */
export class DefaultRenderer extends React.PureComponent<any> {
    render(): ReactNode {
        const { data } = this.props;

        let display = null;
        if (data) {
            if (typeof data === 'string') {
                display = data;
            } else if (typeof data === 'boolean') {
                display = data ? 'true' : 'false';
            } else if (List.isList(data)) {
                // defensively return a MultiValueRenderer, this column likely wasn't declared properly as "multiValue"
                return <MultiValueRenderer data={data} />;
            } else {
                if (data.has('formattedValue')) {
                    display = data.get('formattedValue');
                } else {
                    const o = data.has('displayValue') ? data.get('displayValue') : data.get('value');
                    display = o !== null && o !== undefined ? o.toString() : null;
                }

                if (data.get('url')) {
                    return <a href={data.get('url')}>{display}</a>;
                }
            }
        }

        // issue 36941: when using the default renderer, add css so that line breaks as preserved
        const cls = display?.indexOf('\n') > -1 ? 'whitespace-prewrap' : '';

        return <span className={cls}>{display}</span>;
    }
}
