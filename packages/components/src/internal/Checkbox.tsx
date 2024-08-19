import React, { ChangeEventHandler, FC, memo, MouseEventHandler, PropsWithChildren } from 'react';
import classNames from 'classnames';

interface Props extends PropsWithChildren {
    checked: boolean;
    className?: string;
    disabled?: boolean;
    id?: string;
    name: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onClick?: MouseEventHandler<HTMLInputElement>; // Note: you probably shouldn't be using this
}

// Note: This will be renamed to Checkbox when all react-bootstrap usages of Checkbox are removed.
export const CheckboxLK: FC<Props> = memo(props => {
    const { checked, children, className, disabled = false, id, name, onChange, onClick } = props;
    return (
        <div className={classNames('checkbox', className)}>
            <label>
                <input
                    checked={checked}
                    className=""
                    disabled={disabled}
                    id={id}
                    name={name}
                    onChange={onChange}
                    onClick={onClick}
                    type="checkbox"
                />
                {children}
            </label>
        </div>
    )
});
CheckboxLK.displayName = 'Checkbox';
