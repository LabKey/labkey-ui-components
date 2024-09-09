import React, { FC, memo, useCallback, useRef } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';

export const DateInput: FC<DatePickerProps> = memo(props => {
    const { onSelect } = props;
    const input = useRef<DatePicker>(undefined);

    const onIconClick = useCallback(() => {
        input.current?.setFocus();
    }, []);

    const onSelect_ = useCallback(
        (date: Date, event?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => {
            // focus the input so an onBlur action gets triggered after selection has been made
            input.current?.setFocus();
            onSelect?.(date, event);
        },
        [onSelect]
    );

    return (
        <span className="input-group date-input">
            <DatePicker
                autoComplete="off"
                className="form-control"
                dateFormat="MM/dd/yyyy"
                wrapperClassName="form-control"
                showTimeSelect={false}
                {...props}
                ref={input}
                onSelect={onSelect_}
            />
            <span className="input-group-addon" onClick={onIconClick}>
                <i className="fa fa-calendar" />
            </span>
        </span>
    );
});

DateInput.displayName = 'DateInput';
