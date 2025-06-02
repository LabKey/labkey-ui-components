import React, { FC, memo, useCallback } from 'react';

import { QueryColumn } from '../../../public/QueryColumn';

import { DatePickerInput } from '../forms/input/DatePickerInput';
import {
    formatDate,
    formatDateTime,
    getJsonTimeFormatString,
    getTimeValueFromDatePickerInput,
    isDateTimeCol
} from '../../util/Date';

import { MODIFICATION_TYPES, SELECTION_TYPES } from './constants';
import { ValueDescriptor } from './models';
import { EDIT_GRID_INPUT_CELL_CLASS, genCellKey } from './utils';

export interface DateInputCellProps {
    col: QueryColumn;
    colIdx: number;
    defaultValue?: string;
    disabled?: boolean;
    modifyCell: (
        colIdx: number,
        rowIdx: number,
        newValues: ValueDescriptor[],
        mod: MODIFICATION_TYPES,
        col?: QueryColumn
    ) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    rowIdx: number;
    select: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
}

export const DateInputCell: FC<DateInputCellProps> = memo(props => {
    const { col, defaultValue, colIdx, rowIdx, disabled, modifyCell, onKeyDown, select } = props;

    const onCalendarClose = useCallback(() => {
        select(colIdx, rowIdx);
    }, [colIdx, rowIdx, select]);

    const onDateInputChange = useCallback(
        (newDate: Date | string) => {
            let display, raw = newDate;
            if (newDate && typeof newDate === 'string') display = newDate;
            else if (newDate && newDate instanceof Date) {
                if (col.isTimeColumn) {
                    raw = getJsonTimeFormatString(newDate);
                    display = getTimeValueFromDatePickerInput(newDate, col);
                }
                else {
                    display = isDateTimeCol(col)
                        ? formatDateTime(newDate)
                        : formatDate(newDate);
                }
            }

            modifyCell(colIdx, rowIdx, [{ raw, display }], MODIFICATION_TYPES.REPLACE, col);
        },
        [col, colIdx, modifyCell, rowIdx]
    );

    return (
        <DatePickerInput
            allowDisable={false}
            autoFocus
            disabled={disabled}
            formsy={false}
            inputClassName={`date-input-cell ${EDIT_GRID_INPUT_CELL_CLASS}`}
            inputWrapperClassName=""
            isClearable={false}
            isFormInput={false}
            key={genCellKey(col.fieldKey, rowIdx)}
            onCalendarClose={onCalendarClose}
            onChange={onDateInputChange}
            onKeyDown={onKeyDown}
            queryColumn={col}
            value={defaultValue}
            wrapperClassName="date-input-cell-container"
        />
    );
});

DateInputCell.displayName = 'DateInputCell';
