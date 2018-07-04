/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'

import { ActionValue } from './actions/Action'

interface ValueProps {
    actionValue: ActionValue
    index: number
    onClick?: Function
    onRemove?: Function
}

interface ValueState {
    isActive?: boolean
    isDisabled?: boolean
}

export const valueClassName = 'OmniBox-value';

export class Value extends React.Component<ValueProps, ValueState> {

    constructor(props: ValueProps) {
        super(props);

        this.state = {
            isActive: false,
            isDisabled: false
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
            isActive: true
        });
    }

    onMouseLeave() {
        this.setState({
            isActive: false
        });
    }

    render() {
        const { action, value, displayValue, isReadOnly, isRemovable } = this.props.actionValue;

        const className = classNames(valueClassName, {
            'is-active': this.state.isActive,
            'is-disabled': this.state.isDisabled,
            'is-readonly': isReadOnly
        });

        const iconClassNames = classNames('symbol', 'fa', this.state.isActive && isRemovable !== false ? 'fa-close' : (action.iconCls ? 'fa-' + action.iconCls : ''));

        return (
            <div className={className}
                 onClick={this.onClick.bind(this)}
                 onMouseEnter={this.onMouseEnter.bind(this)}
                 onMouseLeave={this.onMouseLeave.bind(this)}>
                <i className={iconClassNames}
                   onClick={this.onIconClick.bind(this)} />
                {isReadOnly ? <i className="read-lock fa fa-lock" title="locked (read only)" /> : null}
                <span>{displayValue ? displayValue : value}</span>
            </div>
        );
    }
}