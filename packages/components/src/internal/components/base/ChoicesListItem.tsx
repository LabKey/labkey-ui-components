import React, { FC, memo, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

interface Props {
    active: boolean;
    componentRight?: ReactNode;
    disabled?: boolean;
    index: number;
    label: ReactNode;
    onSelect: (index: number) => void;
    subLabel?: string;
}

export const ChoicesListItem: FC<Props> = memo(props => {
    const { label, index, active, onSelect, subLabel, componentRight, disabled } = props;
    const onClick = useCallback(() => {
        onSelect(index);
    }, [onSelect, index]);

    return (
        <button
            className={classNames('list-group-item', { active })}
            onClick={onClick}
            type="button"
            disabled={disabled}
        >
            {label}
            {subLabel && <span className="choices-list__sub-label">{subLabel}</span>}
            {componentRight}
        </button>
    );
});
ChoicesListItem.displayName = 'ChoicesListItem';
