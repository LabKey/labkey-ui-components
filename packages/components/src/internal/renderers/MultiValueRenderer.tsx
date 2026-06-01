/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';
import { Iterable, List, Map } from 'immutable';
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

    if (List.isList(data) && data.size === 1 && col?.isFileInput) {
        return <FileColumnRenderer data={data.get(0)} />;
    }

    let valueArray = data;
    if (col?.isMultiChoice && Map.isMap(data) && data.has('value')) {
        valueArray = data.get('value');
    }

    if (!Iterable.isIterable(valueArray)) return null;

    let i = -1;
    return (
        <div>
            {valueArray
                .map((item, key) => {
                    let text: ReactNode;
                    let url: string;

                    if (Map.isMap(item)) {
                        if (item.has('formattedValue')) {
                            text = item.get('formattedValue');
                        } else {
                            const o = item.has('displayValue') ? item.get('displayValue') : item.get('value');
                            if (Iterable.isIterable(o)) text = o.join(', ');
                            else text = o !== null && o !== undefined ? o.toString() : null;
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
