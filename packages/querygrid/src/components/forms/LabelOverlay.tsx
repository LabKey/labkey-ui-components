/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import { generateId, QueryColumn } from '@glass/base'

export interface LabelOverlayProps {
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
        labelClass: 'control-label col-md-3 col-xs-12 text-left'
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
                {required ? <span className="required-symbol"> *</span> : null}
            </label>
        );
    }
}