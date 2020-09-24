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
import React from 'react';
import classNames from 'classnames';

import { ActionValue } from './actions/Action';

interface ValueProps {
    actionValue: ActionValue;
    index: number;
    onClick?: Function;
    onRemove?: Function;
}

interface ValueState {
    isActive?: boolean;
    isDisabled?: boolean;
}

export const valueClassName = 'OmniBox-value';

export class Value extends React.Component<ValueProps, ValueState> {
    constructor(props: ValueProps) {
        super(props);

        this.state = {
            isActive: false,
            isDisabled: false,
        };
    }

    onClick(event) {
        event.stopPropagation();
        event.preventDefault();
        if (this.props.onClick && !this.props.actionValue.isReadOnly) {
            this.props.onClick(this.props.actionValue, event);
        }
    }

    onIconClick(event) {
        event.stopPropagation();
        event.preventDefault();
        if (this.props.onRemove && this.props.actionValue.isRemovable !== false) {
            this.props.onRemove(this.props.index, event);
        }
    }

    onMouseEnter() {
        this.setState({
            isActive: true,
        });
    }

    onMouseLeave() {
        this.setState({
            isActive: false,
        });
    }

    render() {
        const { action, value, displayValue, isReadOnly, isRemovable } = this.props.actionValue;

        const className = classNames(valueClassName, {
            'is-active': this.state.isActive,
            'is-disabled': this.state.isDisabled,
            'is-readonly': isReadOnly,
        });

        const iconClassNames = classNames(
            'symbol',
            'fa',
            this.state.isActive && isRemovable !== false ? 'fa-close' : action.iconCls ? 'fa-' + action.iconCls : ''
        );

        return (
            <div
                className={className}
                onClick={this.onClick.bind(this)}
                onMouseEnter={this.onMouseEnter.bind(this)}
                onMouseLeave={this.onMouseLeave.bind(this)}
            >
                <i className={iconClassNames} onClick={this.onIconClick.bind(this)} />
                {isReadOnly ? <i className="read-lock fa fa-lock" title="locked (read only)" /> : null}
                <span>{displayValue ? displayValue : value}</span>
            </div>
        );
    }
}
