/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
        } else if (List.isList(data) || col?.isMultiChoice) {
            // defensively return a MultiValueRenderer, this column likely wasn't declared properly as "multiValue"
            return <MultiValueRenderer col={col} data={data} />;
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

            if (style !== undefined) {
                return (
                    <span className={className} style={style}>
                        {display}
                    </span>
                );
            }
        }
    }

    return display;
});

DefaultRenderer.displayName = 'DefaultRenderer';
