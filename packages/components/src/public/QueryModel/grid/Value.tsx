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
import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { ActionValue } from './actions/Action';

interface ValueProps {
    actionValue: ActionValue;
    index: number;
    onClick?: (actionValue: ActionValue, event: any) => void;
    onRemove?: (actionValueIndex: number, event: any) => void;
}

interface ValueState {
    isActive?: boolean;
    isDisabled?: boolean;
}

export const valueClassName = 'filter-status-value';

export class Value extends React.Component<ValueProps, ValueState> {
    constructor(props: ValueProps) {
        super(props);

        this.state = {
            isActive: false,
            isDisabled: false,
        };
    }

    onClick = (event): void => {
        // Issue 50449: Expand icon click area to remove filter value
        const filterBoundBoxClick = event.target.className?.indexOf('filter-status-value') > -1;
        const boxLeftEdge = event.target.getBoundingClientRect().left;
        const isIconClick = event.clientX - boxLeftEdge < 30;
        if (filterBoundBoxClick && isIconClick) {
            this.onIconClick(event);
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        if (this.props.onClick && this.props.actionValue.isReadOnly === undefined) {
            this.props.onClick(this.props.actionValue, event);
        }
    };

    onIconClick = (event): void => {
        event.stopPropagation();
        event.preventDefault();
        if (this.props.onRemove && this.props.actionValue.isRemovable !== false) {
            this.props.onRemove(this.props.index, event);
        }
    };

    onMouseEnter = (): void => {
        this.setState({
            isActive: true,
        });
    };

    onMouseLeave = (): void => {
        this.setState({
            isActive: false,
        });
    };

    render(): ReactNode {
        const { actionValue } = this.props;
        const { action, value, displayValue, isReadOnly, isRemovable } = actionValue;
        const showRemoveIcon = this.state.isActive && isRemovable !== false && actionValue.action.keyword !== 'view';

        const className = classNames(valueClassName, {
            'is-active': this.state.isActive,
            'is-disabled': this.state.isDisabled,
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
                onClick={this.onClick}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
            >
                <i className={iconClassNames} onClick={this.onIconClick} />
                {isReadOnly ? <i className="read-lock fa fa-lock" title={isReadOnly} /> : null}
                <span>{displayValue ?? value}</span>
            </div>
        );
    }
}
