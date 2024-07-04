import React, { ChangeEvent, FC, memo } from 'react';
import classNames from 'classnames';

interface Props {
    checked: boolean;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

// Note: This component is specifically for the Domain Designer, if you need to render a checkbox input you should
// probably be using CheckboxInput instead.
export const Checkbox: FC<Props> = memo(({ checked, children, className, disabled, id, name, onChange }) => (
    <div className={classNames('checkbox', className)}>
        <label>
            <input checked={checked} disabled={disabled} id={id} name={name} onChange={onChange} type="checkbox" />
            {children}
        </label>
    </div>
));
