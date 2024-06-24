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
import React, { ReactNode } from 'react';

import { QueryColumn } from '../../../public/QueryColumn';
import { generateId } from '../../util/utils';

import { Popover } from '../../Popover';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Placement } from '../../useOverlayPositioning';

import { HelpTipRenderer } from './HelpTipRenderer';
import { INPUT_LABEL_CLASS_NAME } from './constants';

export interface LabelOverlayProps {
    addLabelAsterisk?: boolean;
    column?: QueryColumn;
    description?: string;
    helpTipRenderer?: string;
    inputId?: string;
    isFormsy?: boolean;
    label?: string;
    labelClass?: string;
    placement?: Placement;
    required?: boolean;
    type?: string;
}

export class LabelOverlay extends React.Component<LabelOverlayProps> {
    static defaultProps = {
        isFormsy: true,
        addLabelAsterisk: false,
        labelClass: INPUT_LABEL_CLASS_NAME,
        placement: 'right',
    };

    _popoverId: string;

    constructor(props: LabelOverlayProps) {
        super(props);

        this._popoverId = generateId();
    }

    overlayBody = (): any => {
        const { column, required, children, helpTipRenderer } = this.props;
        const description = this.props.description ? this.props.description : column ? column.description : null;
        const type = this.props.type ? this.props.type : column ? column.type : null;

        if (column?.helpTipRenderer || helpTipRenderer) {
            return <HelpTipRenderer type={column?.helpTipRenderer || helpTipRenderer} />;
        }

        return (
            <>
                {description && (
                    <p className="ws-pre-wrap">
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
                {column?.format && (
                    <p>
                        <strong>Display Format: </strong>
                        {column.format}
                    </p>
                )}
                {column?.phiProtected && (
                    <p>
                        PHI protected data removed.
                    </p>
                )}
                {required && (
                    <p>
                        <small>
                            <i>This field is required.</i>
                        </small>
                    </p>
                )}
                {children}
            </>
        );
    };

    overlayContent() {
        const { column, helpTipRenderer, placement } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;
        const popoverClassName = column?.helpTipRenderer || helpTipRenderer ? 'label-help-arrow-top' : undefined;
        const body = this.overlayBody();
        return (
            <Popover id={this._popoverId} title={label} placement={placement} className={popoverClassName}>
                {body}
            </Popover>
        );
    }

    getOverlay() {
        const { helpTipRenderer } = this.props;

        if (helpTipRenderer === 'NONE') return null;

        return (
            <OverlayTrigger id={this._popoverId} overlay={this.overlayContent()}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
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
                    {required || addLabelAsterisk ? <span className="required-symbol"> *</span> : null}
                </span>
            );
        }

        return (
            <label className={(labelClass ? labelClass + ' ' : '') + 'text__truncate-and-wrap'} htmlFor={inputId}>
                <span>{label}</span>&nbsp;
                {overlay}
                {required || addLabelAsterisk ? <span className="required-symbol"> *</span> : null}
            </label>
        );
    }
}
