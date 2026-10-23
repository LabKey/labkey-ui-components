/*
 * Copyright (c) 2018-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {
    FC,
    KeyboardEvent,
    KeyboardEventHandler,
    memo,
    MouseEvent,
    MouseEventHandler,
    useCallback,
    useMemo,
    useState,
} from 'react';
import classNames from 'classnames';

import { ActionKeyword, ActionValue } from './actions/Action';
import { Key, useEnterEscape } from '../../useEnterEscape';
import { OverlayTrigger } from '../../../internal/OverlayTrigger';
import { Popover } from '../../../internal/Popover';
import { generateId } from '../../../internal/util/utils';

export type OnClickValue = (actionValue: ActionValue, event?: MouseEvent<HTMLElement>) => void;
export type OnRemoveValue = (
    actionValueIndex: number,
    event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>
) => void;

interface ValueProps {
    actionValue: ActionValue;
    index: number;
    lockReadOnlyForDelete?: boolean;
    onClick?: OnClickValue;
    onRemove?: OnRemoveValue;
}

export const valueClassName = 'filter-status-value';

export const Value: FC<ValueProps> = memo(({ actionValue, index, lockReadOnlyForDelete, onClick, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { action, value, displayValue, isReadOnly, isRemovable } = actionValue;
    const popoverId = useMemo(() => generateId('filter-status-value-popover-'), []);
    const isActive = isHovered || isFocused;
    const isClickable = !!onClick && isReadOnly === undefined;
    const canRemoveByKey = !!onRemove && isRemovable !== false && (!lockReadOnlyForDelete || !isReadOnly);

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
        if (isClickable) {
            onClick(actionValue, undefined);
        }
    }, [actionValue, isClickable, onClick]);

    const onMouseEnter = useCallback((): void => setIsHovered(true), []);
    const onMouseLeave = useCallback((): void => setIsHovered(false), []);
    const onFocus = useCallback((): void => setIsFocused(true), []);
    const onBlur = useCallback((): void => setIsFocused(false), []);
    const onEnterKeyDown = useEnterEscape(onValueEnter);
    const onKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
        (event): void => {
            if (canRemoveByKey && (event.key === Key.DELETE || event.key === Key.BACKSPACE)) {
                event.preventDefault();
                onRemove(index, event);
                return;
            }
            onEnterKeyDown(event);
        },
        [canRemoveByKey, index, onEnterKeyDown, onRemove]
    );

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
            aria-keyshortcuts={canRemoveByKey ? 'Delete Backspace' : undefined}
            aria-label={isClickable ? `Edit ${action.keyword}: ${displayValue ?? value}` : undefined}
            className={className}
            data-keyword={action.keyword}
            onBlur={onBlur}
            onClick={onValueClick}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role={isClickable ? 'button' : undefined}
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
