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
import { List } from 'immutable';

import { QueryColumn } from '../../public/QueryColumn';

import { getDataStyling } from '../util/utils';
import { isConditionalFormattingEnabled } from '../app/utils';

import { AppLink } from '../url/AppLink';

import { MultiValueRenderer } from './MultiValueRenderer';
import { FileColumnRenderer } from './FileColumnRenderer';

interface Props {
    col?: QueryColumn;
    columnIndex?: number;
    data: any;
    noLink?: boolean;
    row?: any;
    rowIndex?: number;
}

const TARGET_BLANK = '_blank';

/**
 * This is the default cell renderer for Details/Grids using a QueryGridModel.
 */
export const DefaultRenderer: FC<Props> = memo(({ col, data, noLink }) => {
    let display = null;
    let style;

    if (data) {
        if (typeof data === 'string') {
            display = data;
        } else if (typeof data === 'boolean') {
            display = data ? 'true' : 'false';
        } else if (List.isList(data)) {
            // defensively return a MultiValueRenderer, this column likely wasn't declared properly as "multiValue"
            return <MultiValueRenderer data={data} col={col} />;
        } else if (col?.isFileInput) {
            return <FileColumnRenderer data={data} />;
        } else {
            let className: string;
            if (isConditionalFormattingEnabled()) {
                style = getDataStyling(data);
                if (style?.backgroundColor) {
                    className = 'status-pill';
                }
            }
            if (data.has('formattedValue')) {
                display = data.get('formattedValue');
            } else {
                const o = data.has('displayValue') ? data.get('displayValue') : data.get('value');
                display = o !== null && o !== undefined ? o.toString() : null;
            }

            const url = data.get('url');

            if (url && !noLink) {
                const targetBlank = data.get('urlTarget') === TARGET_BLANK;
                return (
                    <AppLink className={className} style={style} targetBlank={targetBlank} to={url}>
                        {display}
                    </AppLink>
                );
            }

            if (style !== undefined) return <span style={style}>{display}</span>;
        }
    }

    return display;
});

DefaultRenderer.displayName = 'DefaultRenderer';
