/*
 * Copyright (c) 2018-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, MouseEvent, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { ActionKeyword, ActionValue } from './actions/Action';
import { useEnterEscape } from '../../useEnterEscape';
import { OverlayTrigger } from '../../../internal/OverlayTrigger';
import { Popover } from '../../../internal/Popover';
import { generateId } from '../../../internal/util/utils';

export type OnClickValue = (actionValue: ActionValue, event?: MouseEvent<HTMLElement>) => void;
export type OnRemoveValue = (actionValueIndex: number, event: MouseEvent<HTMLElement>) => void;

interface ValueProps {
    actionValue: ActionValue;
    index: number;
    lockReadOnlyForDelete?: boolean;
    onClick?: OnClickValue;
    onRemove?: OnRemoveValue;
}

export const valueClassName = 'filter-status-value';

export const Value: FC<ValueProps> = memo(({ actionValue, index, lockReadOnlyForDelete, onClick, onRemove }) => {
    const [isActive, setIsActive] = useState(false);
    const { action, value, displayValue, isReadOnly, isRemovable } = actionValue;
    const popoverId = useMemo(() => generateId('filter-status-value-popover-'), []);

    const onIconClick = useCallback<MouseEventHandler<HTMLElement>>(
        (event): void => {
            event.stopPropagation();
            event.preventDefault();
            if (onRemove && isRemovable !== false) {
                onRemove(index, event);
            }
        },
        [index, isRemovable, onRemove]
    );

    const onValueClick = useCallback<MouseEventHandler<HTMLDivElement>>(
        (event): void => {
            // Issue 50449: Expand icon click area to remove filter value
            const target = event.target as HTMLElement;
            const filterBoundBoxClick = target.className?.indexOf('filter-status-value') > -1;
            const boxLeftEdge = target.getBoundingClientRect().left;
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

    const onValueEnter = useCallback((): void => {
        if (onClick && isReadOnly === undefined) {
            onClick(actionValue, undefined);
        }
    }, [actionValue, isReadOnly, onClick]);

    const onMouseEnter = useCallback((): void => setIsActive(true), []);
    const onMouseLeave = useCallback((): void => setIsActive(false), []);
    const onKeyDown = useEnterEscape(onValueEnter);

    const showRemoveIcon = isActive && isRemovable !== false && action.keyword !== ActionKeyword.View;

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

    const content = (
        <div
            className={className}
            data-keyword={action.keyword}
            onClick={onValueClick}
            onKeyDown={onKeyDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            tabIndex={0}
        >
            {(!lockReadOnlyForDelete || !isReadOnly) && <i className={iconClassNames} onClick={onIconClick} />}
            {isReadOnly ? <i className="read-lock fa fa-lock" /> : null}
            <span>{displayValue ?? value}</span>
        </div>
    );

    if (!!isReadOnly) {
        return (
            <OverlayTrigger
                overlay={
                    <Popover id={popoverId} placement="top">
                        {isReadOnly}
                    </Popover>
                }
            >
                {content}
            </OverlayTrigger>
        );
    }

    return content;
});
Value.displayName = 'Value';
