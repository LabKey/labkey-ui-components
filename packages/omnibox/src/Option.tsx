/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'

import { ActionOption } from './actions/Action'

interface OptionProps {
    // required
    actionOption: ActionOption
    text: string

    // optional
    index?: number
    isAction?: boolean
    isComplete?: boolean
    isFocused?: boolean
    isSelected?: boolean
    nextText?: string
    onFocus?: (actionOption?: ActionOption, index?: number, event?: React.SyntheticEvent<any>) => any
    onOptionClick?: (actionOption?: ActionOption) => any
}

export class Option extends React.Component<OptionProps, any> {
    static defaultProps = {
        isAction: false,
        isComplete: false,
        isFocused: false,
        isSelected: false
    };

    constructor(props: OptionProps) {
        super(props);

        this.handleFocus = this.handleFocus.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    handleFocus(event: React.SyntheticEvent<any>) {
        const { actionOption, index, isFocused, onFocus } = this.props;

        if (!isFocused && onFocus !== undefined) {
            onFocus(actionOption, index, event);
        }
    }

    handleMouseDown(event: React.MouseEvent<any>) {
        const { onOptionClick, actionOption } = this.props;

        event.preventDefault();
        event.stopPropagation();
        if (actionOption.selectable !== false && onOptionClick) {
            onOptionClick(actionOption);
        }
    }

    render() {
        const { actionOption, isFocused, isSelected, nextText, text } = this.props;
        const { action } = actionOption;
        const { iconCls, oneWordLabel, keyword } = action;

        let optionClass = classNames('OmniBox-option', {
            'is-focused': isFocused,
            'is-selected': isSelected
        });

        return (
            <li className={optionClass}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleFocus}
                onMouseMove={this.handleFocus}
                role="option">
                <span className="completion">
                    {iconCls ? <i className={classNames('fa', (iconCls ? 'fa-' + iconCls : ''))} style={{paddingRight: '5px'}} /> : null}
                    {action && keyword ? <b>{oneWordLabel ? oneWordLabel : keyword}&nbsp;</b> : null}
                    <span className="completion-text">{text}</span>
                    {nextText ? <span style={{fontStyle: 'italic', opacity: 0.7}}>{nextText}</span> : null}
                </span>
            </li>
        )
    }
}