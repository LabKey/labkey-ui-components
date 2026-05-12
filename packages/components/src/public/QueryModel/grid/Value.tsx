/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, useCallback, useState } from 'react';
import classNames from 'classnames';

import { ActionValue } from './actions/Action';

interface ValueProps {
    actionValue: ActionValue;
    index: number;
    lockReadOnlyForDelete?: boolean;
    onClick?: (actionValue: ActionValue, event: any) => void;
    onRemove?: (actionValueIndex: number, event: any) => void;
}

export const valueClassName = 'filter-status-value';

export const Value: FC<ValueProps> = memo(({ actionValue, index, lockReadOnlyForDelete, onClick, onRemove }) => {
    const [isActive, setIsActive] = useState(false);
    const { action, value, displayValue, isReadOnly, isRemovable } = actionValue;

    const onIconClick = useCallback(
        (event): void => {
            event.stopPropagation();
            event.preventDefault();
            if (onRemove && isRemovable !== false) {
                onRemove(index, event);
            }
        },
        [index, isRemovable, onRemove]
    );

    const onValueClick = useCallback(
        (event): void => {
            // Issue 50449: Expand icon click area to remove filter value
            const filterBoundBoxClick = event.target.className?.indexOf('filter-status-value') > -1;
            const boxLeftEdge = event.target.getBoundingClientRect().left;
            const isIconClick = event.clientX - boxLeftEdge < 30;
            if (filterBoundBoxClick && isIconClick) {
                onIconClick(event);
                return;
            }

            event.stopPropagation();
            event.preventDefault();
            if (onClick && isReadOnly === undefined) {
                onClick(actionValue, event);
            }
        },
        [actionValue, isReadOnly, onClick, onIconClick]
    );

    const onMouseEnter = useCallback((): void => setIsActive(true), []);
    const onMouseLeave = useCallback((): void => setIsActive(false), []);

    const showRemoveIcon = isActive && isRemovable !== false && action.keyword !== 'view';

    const className = classNames(valueClassName, {
        'is-active': isActive,
        'is-disabled': lockReadOnlyForDelete && isReadOnly,
        'is-readonly': isReadOnly !== undefined,
    });

    const iconClassNames = classNames(
        'symbol',
        'fa',
        showRemoveIcon ? 'fa-close' : action.iconCls ? 'fa-' + action.iconCls : ''
    );

    return (
        <div
            className={className}
            onClick={onValueClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={isReadOnly}
        >
            {(!lockReadOnlyForDelete || !isReadOnly) && <i className={iconClassNames} onClick={onIconClick} />}
            {isReadOnly ? <i className="read-lock fa fa-lock" /> : null}
            <span>{displayValue ?? value}</span>
        </div>
    );
});
Value.displayName = 'Value';
