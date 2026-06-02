/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Iterable, Map } from 'immutable';

import classNames from 'classnames';

import { QueryColumn } from '../../public/QueryColumn';
import { isDateTimeInPast } from '../util/Date';
import { getTextAlignClassName } from '../components/base/models/GridColumn';

export interface ExpirationDateColumnRendererProps {
    col?: QueryColumn;
    columnIndex?: number;
    data: Map<any, any> | Record<string, any>;
    tableCell?: boolean;
}

export const ExpirationDateColumnRenderer: FC<ExpirationDateColumnRendererProps> = memo(
    ({ data, columnIndex, col, tableCell = true }) => {
        let expired = false;
        let displayValue = null;
        let value = null;
        if (data) {
            if (Iterable.isIterable(data)) {
                value = data.get('value');
                displayValue = data.get('formattedValue') ?? data.get('displayValue');
            } else if (data['value']) {
                value = data['value'];
                displayValue = data['formattedValue'] ?? data['displayValue'];
            }

            displayValue = displayValue ?? value;
        }

        if (value) expired = isDateTimeInPast(value);

        if (tableCell) {
            return (
                <td
                    className={classNames(getTextAlignClassName(col), { 'expired-grid-cell': expired })}
                    key={columnIndex ?? col?.name}
                >
                    <div className={classNames({ 'expired-grid-cell-content': expired })}>{displayValue}</div>
                </td>
            );
        }

        return (
            <span
                className={classNames({
                    'expired-form-field': expired,
                })}
            >
                {displayValue}
            </span>
        );
    }
);

ExpirationDateColumnRenderer.displayName = 'ExpirationDateColumnRenderer';
