import {QueryColumn} from "../../../public/QueryColumn";
import {ValueDescriptor} from "../../models";
import {MODIFICATION_TYPES, SELECTION_TYPES} from "../../constants";
import React, {FC, memo, useCallback, useMemo} from "react";
import {DatePickerInput} from "../forms/input/DatePickerInput";

export interface DateInputCellProps {
    col: QueryColumn;
    colIdx: number;
    rowIdx: number;
    disabled?: boolean;
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    select: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
    defaultValue?: string;
}

export const DateInputCell: FC<DateInputCellProps> = memo(props => {
    const { col, defaultValue, colIdx, rowIdx, disabled } = props;

    const onDateInputChange = useCallback((newDate: string) => {
        const { colIdx, modifyCell, rowIdx, select } = props;
        modifyCell(colIdx, rowIdx, [{ raw: newDate, display: newDate }], MODIFICATION_TYPES.REPLACE);
        select(colIdx, rowIdx);
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
        />
    )
});
