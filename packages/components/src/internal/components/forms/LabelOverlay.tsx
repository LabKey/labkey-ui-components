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
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { QueryColumn } from '../../..';
import { LabelHelpTip } from '../../..';
import { generateId } from '../../..';

export interface LabelOverlayProps {
    inputId?: string;
    isFormsy?: boolean;
    label?: string;
    labelClass?: string;
    description?: string;
    placement?: any;
    type?: string;
    column?: QueryColumn;
    required?: boolean;
    addLabelAsterisk?: boolean;
    content?: any; // other content to render to the popover
    canMouseOverTooltip?: boolean;
}

export class LabelOverlay extends React.Component<LabelOverlayProps, any> {
    static defaultProps = {
        isFormsy: true,
        addLabelAsterisk: false,
        labelClass: 'control-label col-md-3 col-xs-12 text-left',
        canMouseOverTooltip: false,
    };

    _popoverId: string;

    constructor(props: LabelOverlayProps) {
        super(props);

        this._popoverId = generateId();
    }

    overlayBody = (): any => {
        const { column, required, content } = this.props;
        const description = this.props.description ? this.props.description : column ? column.description : null;
        const type = this.props.type ? this.props.type : column ? column.type : null;

        return (
            <>
                {description && (
                    <p>
                        <strong>Description: </strong>
                        {description}
                    </p>
                )}
                {type && (
                    <p>
                        <strong>Type: </strong>
                        {type}
                    </p>
                )}
                {column && column.fieldKey != column.caption && (
                    <p>
                        <strong>Field Key: </strong>
                        {column.fieldKey}
                    </p>
                )}
                {required && (
                    <p>
                        <small>
                            <i>This field is required.</i>
                        </small>
                    </p>
                )}
                {content}
            </>
        );
    };

    overlayContent() {
        const { column } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;
        const body = this.overlayBody();
        return (
            <Popover id={this._popoverId} title={label} bsClass="popover">
                {body}
            </Popover>
        );
    }

    getOverlay() {
        const { column, placement, canMouseOverTooltip } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;
        return !canMouseOverTooltip ? (
            <OverlayTrigger placement={placement} overlay={this.overlayContent()}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        ) : (
            <LabelHelpTip id={this._popoverId} title={label} body={this.overlayBody} placement={placement} />
        );
    }

    render() {
        const { column, inputId, isFormsy, labelClass, required, addLabelAsterisk } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;

        const overlay = this.getOverlay();

        if (isFormsy) {
            // when being used as a label for a formsy component directly this will use just a span without the
            // classes applied as well as not needing to handle 'required' display
            return (
                <span>
                    {label}&nbsp;
                    {overlay}
                    {!required && addLabelAsterisk ? <span className="required-symbol"> *</span> : null}
                </span>
            );
        }

        return (
            <label
                className={labelClass ? labelClass + ' text__truncate-and-wrap' : 'text__truncate-and-wrap'}
                title={label}
                htmlFor={inputId}
            >
                <span>{label}</span>&nbsp;
                {overlay}
                {required || addLabelAsterisk ? <span className="required-symbol"> *</span> : null}
            </label>
        );
    }
}
