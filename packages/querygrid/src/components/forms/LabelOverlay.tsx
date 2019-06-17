/*
 * Copyright (c) 2019 LabKey Corporation
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
import * as React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import { generateId, QueryColumn } from '@glass/base'

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
        labelClass: 'control-label col-sm-3 text-left'
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
            <Popover id={this._popoverId} title={label} bsClass="registry-insert__field-label popover">
                {description && <p><strong>Description: </strong>{description}</p>}
                {type && <p><strong>Type: </strong>{type}</p>}
                {(column && column.fieldKey != column.caption) && <p><strong>Field Key: </strong>{column.fieldKey}</p>}
                {(typeof required === 'boolean' && required === true) && <p><small><i>This field is required.</i></small></p>}
            </Popover>
        );
    }

    render() {
        const { column, inputId, isFormsy, labelClass, placement } = this.props;
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
            </label>
        );
    }

}