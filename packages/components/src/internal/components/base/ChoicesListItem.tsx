import React, { FC, memo, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

interface Props {
    active: boolean;
    componentRight?: ReactNode;
    index: number;
    itemType?: string;
    label: string;
    onSelect: (index: number) => void;
}

export const ChoicesListItem: FC<Props> = memo(props => {
    const { label, index, active, onSelect, itemType, componentRight } = props;
    const onClick = useCallback(() => {
        onSelect(index);
    }, [onSelect, index]);

    return (
        <button className={classNames('list-group-item', { active })} onClick={onClick} type="button">
            {label}
            {itemType && <span className="choices-list__item-type">{itemType}</span>}
            {componentRight}
        </button>
    );
});
ChoicesListItem.displayName = 'ChoicesListItem';
