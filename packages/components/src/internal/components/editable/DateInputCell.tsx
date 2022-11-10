import React, { FC, memo, useCallback } from 'react';

import { QueryColumn } from '../../../public/QueryColumn';

import { MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { DatePickerInput } from '../forms/input/DatePickerInput';
import { formatDate, formatDateTime, isDateTimeCol } from '../../util/Date';

import { ValueDescriptor } from './models';

export interface DateInputCellProps {
    col: QueryColumn;
    colIdx: number;
    defaultValue?: string;
    disabled?: boolean;
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    rowIdx: number;
    select: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
}

export const DateInputCell: FC<DateInputCellProps> = memo(props => {
    const { col, defaultValue, colIdx, rowIdx, disabled, onKeyDown } = props;

    const onDateInputChange = useCallback((newDate: Date) => {
        const { colIdx, modifyCell, rowIdx, col } = props;
        let displayValue = null;
        if (newDate) {
            if (isDateTimeCol(col)) displayValue = formatDateTime(newDate);
            else displayValue = formatDate(newDate);
        }

        modifyCell(colIdx, rowIdx, [{ raw: newDate, display: displayValue }], MODIFICATION_TYPES.REPLACE);
    }, []);

    return (
        <DatePickerInput
            key={colIdx + '-' + rowIdx}
            queryColumn={col}
            value={defaultValue}
            initValueFormatted={false}
            allowDisable={false}
            disabled={disabled}
            wrapperClassName="date-input-cell-container"
            inputClassName="date-input-cell cellular-input"
            inputWrapperClassName=""
            onChange={onDateInputChange}
            formsy={false}
            isClearable={false}
            autoFocus={true}
            isFormInput={false}
            onKeyDown={onKeyDown}
        />
    );
});
