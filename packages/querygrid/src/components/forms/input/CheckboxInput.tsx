/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { QueryColumn } from '@glass/base'
import { QueryColumnFieldLabel } from '../LabelOverlay';

interface CheckboxInputProps {
    allowDisable?: boolean
    label?: any
    name?: string
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    value?: any
}

interface CheckboxInputState {
    isDisabled: boolean
    checked: boolean
}

export class CheckboxInput extends React.Component<CheckboxInputProps, CheckboxInputState> {

    static defaultProps = {
        showLabel: true,
        allowDisable: false
    };

    constructor(props: CheckboxInputProps) {
        super(props);
        this.toggleDisabled = this.toggleDisabled.bind(this);
        this.onClick = this.onClick.bind(this);

        this.state = {
            isDisabled: false,
            checked: props.value === true
        }
    }

    toggleDisabled() {
        this.setState(() => {
            return {
                isDisabled: !this.state.isDisabled
            }
        });
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
            <div className="form-gorup row">
                <QueryColumnFieldLabel
                    label={label}
                    labelOverlayProps={{isFormsy: false}}
                    showLabel={showLabel}
                    allowDisable={allowDisable}
                    column={queryColumn}
                    isDisabled = {isDisabled}
                    onClick = {this.toggleDisabled}/>
                <div className={"col-sm-9"}>
                    <input
                        disabled={this.state.isDisabled}
                        name={name ? name : queryColumn.name}
                        required={queryColumn.required}
                        type={"checkbox"}
                        checked={this.state.checked}
                        onClick={this.onClick}
                    />
                </div>
            </div>
        );
    }
}