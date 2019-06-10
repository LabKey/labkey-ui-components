/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import { generateId, QueryColumn } from '@glass/base'
import { ToggleWithInputField } from './input/ToggleWithInputField';
import { getFieldEnabledFieldName } from './QueryFormInputs';

interface LabelOverlayProps {
    inputId?: string
    isFormsy?: boolean
    label?: string
    labelClass?: string
    description?: string
    placement?: any
    type?: string
    column?: QueryColumn
    required?: boolean
}

export class LabelOverlay extends React.Component<LabelOverlayProps, any> {

    static defaultProps = {
        isFormsy: true,
        labelClass: 'control-label col-sm-3 col-xs-12 text-left'
    };

    _popoverId: string;

    constructor(props: LabelOverlayProps) {
        super(props);

        this._popoverId = generateId();
    }

    overlayContent() {
        const { column, required } = this.props;

        const label = this.props.label ? this.props.label : (column ? column.caption : null);
        const description = this.props.description ? this.props.description : (column ? column.description : null);
        const type = this.props.type ? this.props.type : (column ? column.type : null);

        return (
            <Popover id={this._popoverId} title={label} bsClass="popover">
                {description && <p><strong>Description: </strong>{description}</p>}
                {type && <p><strong>Type: </strong>{type}</p>}
                {(column && column.fieldKey != column.caption) && <p><strong>Field Key: </strong>{column.fieldKey}</p>}
                {required && <p><small><i>This field is required.</i></small></p>}
            </Popover>
        );
    }

    render() {
        const { column, inputId, isFormsy, labelClass, placement, required } = this.props;
        const label = this.props.label ? this.props.label : (column ? column.caption : null);

        if (isFormsy) {
            // when being used as a label for a formsy component directly this will use just a span without the
            // classes applied as well as not needing to handle 'required' display
            return (
                <span>
                    {label}&nbsp;
                    <OverlayTrigger
                        placement={placement}
                        overlay={this.overlayContent()}>
                        <i className="fa fa-question-circle"/>
                    </OverlayTrigger>
                </span>
            )
        }

        return (
            <label className={labelClass} htmlFor={inputId}>
                <span>{label}</span>&nbsp;
                <OverlayTrigger
                    placement={placement}
                    overlay={this.overlayContent()}>
                    <i className="fa fa-question-circle"/>
                </OverlayTrigger>
                {required ? <span> *</span> : null}
            </label>
        );
    }
}


interface QueryColumnFieldLabelProps  {
    id?: any
    fieldName?: string
    label?: React.ReactNode
    column?: QueryColumn,
    allowDisable?: boolean
    isDisabled?: boolean
    labelOverlayProps?: LabelOverlayProps
    showLabel?: boolean
    onClick?: any
    style?: any
    withLabelOverlay?: boolean
}

export class QueryColumnFieldLabel extends React.Component<QueryColumnFieldLabelProps, any> {

    static defaultProps : Partial<QueryColumnFieldLabelProps> = {
        showLabel: true,
        withLabelOverlay: true
    };


    render() {
        const { label, column, fieldName, id, showLabel, allowDisable, isDisabled, onClick, style, withLabelOverlay } = this.props;
        let labelOverlayProps = this.props.labelOverlayProps;

        if (!showLabel)
            return null;


        // when not displaying with Formsy and we are displaying the field toggle, we adjust
        // the columns since the toggle appears outside the label.
        let toggleClassName;
        if (allowDisable && labelOverlayProps && !labelOverlayProps.isFormsy && !labelOverlayProps.labelClass) {
            labelOverlayProps.labelClass = "control-label col-sm-2 col-xs-11 text-left";
            toggleClassName = "col-xs-1";
        }

        let labelBody;
        if (withLabelOverlay)
            labelBody = <LabelOverlay column={column} {...labelOverlayProps}/>;
        else
            labelBody = label ? label : (column ? column.caption : null);


        return (
            <>
                {labelBody}
                {allowDisable && <ToggleWithInputField
                        active = {!isDisabled}
                        onClick = {onClick}
                        id = { id ? id : column.fieldKey}
                        inputFieldName = {getFieldEnabledFieldName(fieldName ? fieldName : column.fieldKey)}
                        on = {"Yes"}
                        off = {"No"}
                        style = {style ? style : {float: "right"}}
                        containerClassName={toggleClassName}
                />}
            </>
        );
    }
}