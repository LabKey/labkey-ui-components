/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback } from 'react';
import classNames from 'classnames';

interface Props {
    active: boolean;
    componentRight?: ReactNode;
    disabled?: boolean;
    group?: string;
    index: number;
    label: ReactNode;
    onSelect: (index: number, group?: string) => void;
    subLabel?: string;
}

export const ChoicesListItem: FC<Props> = memo(props => {
    const { label, group, index, active, onSelect, subLabel, componentRight, disabled } = props;
    const onClick = useCallback(() => {
        onSelect(index, group);
    }, [onSelect, index, group]);

    return (
        <button
            aria-current={active || undefined}
            className={classNames('list-group-item', { active })}
            disabled={disabled}
            onClick={onClick}
            type="button"
        >
            {label}
            {subLabel && <span className="choices-list__sub-label">{subLabel}</span>}
            {componentRight}
        </button>
    );
});
ChoicesListItem.displayName = 'ChoicesListItem';
