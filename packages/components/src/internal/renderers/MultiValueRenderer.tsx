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
import React, { FC, Fragment, memo, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { QueryColumn } from '../../public/QueryColumn';
import { FileColumnRenderer } from './FileColumnRenderer';

export interface MultiValueRendererProps {
    col?: QueryColumn;
    data: Map<any, any>;
}

export const MultiValueRenderer: FC<MultiValueRendererProps> = memo(({ data, col }) => {
    if (!data || data.size === 0) {
        return null;
    }

    if (
        List.isList(data) &&
        data.size === 1 &&
        (col?.type?.toLowerCase() === 'file' || col?.inputType?.toLowerCase() === 'file')
    ) {
        return <FileColumnRenderer data={data.get(0)} />;
    }

    let i = -1;
    return (
        <div>
            {data
                .map((item, key) => {
                    let text: ReactNode;
                    let url: string;

                    if (Map.isMap(item)) {
                        if (item.has('formattedValue')) {
                            text = item.get('formattedValue');
                        } else {
                            const o = item.has('displayValue') ? item.get('displayValue') : item.get('value');
                            text = o !== null && o !== undefined ? o.toString() : null;
                        }

                        url = item.get('url');
                    } else if (item !== undefined && item !== null) {
                        text = item.toString();
                    } else {
                        return null;
                    }

                    if (text === undefined || text === null || text === '') return null;

                    // If the string has \n characters, use whiteSpace style to preserve them
                    if (typeof text === 'string' && text.indexOf('\n') > -1) {
                        text = <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
                    }

                    return (
                        // IntelliJ mistakenly presumes that key is an index.
                        // In fact, it is the key of the map which is unique.

                        <span key={key}>
                            {++i > 0 ? ', ' : ''}
                            {url ? <a href={url}>{text}</a> : text}
                        </span>
                    );
                })
                .toArray()}
        </div>
    );
});

MultiValueRenderer.displayName = 'MultiValueRenderer';
