/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { QueryColumn } from '@glass/base'
import { FieldLabel } from '../FieldLabel'
import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

interface CheckboxInputProps extends DisableableInputProps {
    label?: any
    name?: string
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    value?: any
}

interface CheckboxInputState extends DisableableInputState {
    checked: boolean
}

export class CheckboxInput extends DisableableInput<CheckboxInputProps, CheckboxInputState> {

    static defaultProps = {...DisableableInput.defaultProps, showLabel: true};

    constructor(props: CheckboxInputProps) {
        super(props);
        this.onClick = this.onClick.bind(this);

        this.state = {
            checked: props.value === true,
            isDisabled: props.initiallyDisabled
        }
    }

    onClick() {
        this.setState(() => {
            return {
                checked: !this.state.checked
            }
        })
    }

    render() {
        const {
            allowDisable,
            label,
            name,
            queryColumn,
            showLabel,
        } = this.props;
        const { isDisabled } = this.state;


        // N.B.  We do not use the Checkbox component from Formsy because it does not support
        // React.Nodes as labels.  Using a label that is anything but a string when using Checkbox
        // produces a "Converting circular structure to JSON" error.
        return (
            <div className="form-group row">
                <FieldLabel
                    label={label}
                    labelOverlayProps={{isFormsy: false}}
                    showLabel={showLabel}
                    showToggle={allowDisable}
                    column={queryColumn}
                    isDisabled = {isDisabled}
                    toggleProps = {{
                        onClick: this.toggleDisabled,
                    }}/>
                <div className={"col-sm-9 col-xs-12"}>
                    <input
                        disabled={this.state.isDisabled}
                        name={name ? name : queryColumn.name}
                        required={queryColumn.required}
                        type={"checkbox"}
                        value={this.state.checked.toString()}
                        checked={this.state.checked}
                        onChange={this.onClick}
                    />
                </div>
            </div>
        );
    }
}