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
import React, { PropsWithChildren, ReactNode } from 'react';

import { QueryColumn } from '../../../public/QueryColumn';
import { generateId } from '../../util/utils';

import { Popover } from '../../Popover';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Placement } from '../../useOverlayPositioning';

import { HelpTipRenderer } from './HelpTipRenderer';
import { INPUT_LABEL_CLASS_NAME } from './constants';
import { DOMAIN_FIELD, DomainFieldHelpTipContents } from './DomainFieldHelpTipContents';

export interface LabelOverlayProps extends PropsWithChildren {
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
        const { column, required, description, type, children, helpTipRenderer } = this.props;

        if (column?.helpTipRenderer || helpTipRenderer) {
            return (
                <HelpTipRenderer type={column?.helpTipRenderer || helpTipRenderer} column={column}>
                    {children}
                </HelpTipRenderer>
            );
        }

        return (
            <DomainFieldHelpTipContents column={column} required={required} description={description} type={type}>
                {children}
            </DomainFieldHelpTipContents>
        );
    };

    overlayContent() {
        const { column, helpTipRenderer, placement } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;
        const _helpTipRenderer = column?.helpTipRenderer || helpTipRenderer;
        const popoverClassName =
            _helpTipRenderer && _helpTipRenderer !== DOMAIN_FIELD && placement === 'right'
                ? 'label-help-arrow-top'
                : undefined;
        const body = this.overlayBody();
        return (
            <Popover id={this._popoverId} title={label} placement={placement} className={popoverClassName}>
                {body}
            </Popover>
        );
    }

    getOverlay(): ReactNode {
        const { helpTipRenderer } = this.props;

        if (helpTipRenderer === 'NONE') return null;

        return (
            <OverlayTrigger id={this._popoverId} overlay={this.overlayContent()}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        );
    }

    render(): ReactNode {
        const { column, inputId, isFormsy, labelClass, required, addLabelAsterisk } = this.props;
        const label = this.props.label ? this.props.label : column ? column.caption : null;

        const overlay = this.getOverlay();

        if (isFormsy) {
            // when being used as a label for a formsy component directly this will use just a span without the
            // classes applied as well as not needing to handle 'required' display
            return (
                <span>
                    {label}&nbsp;
                    {required || addLabelAsterisk ? <span className="required-symbol">* </span> : null}
                    {overlay}
                </span>
            );
        }

        return (
            <label className={(labelClass ? labelClass + ' ' : '') + 'text__truncate-and-wrap'} htmlFor={inputId}>
                <span>{label}</span>&nbsp;
                {required || addLabelAsterisk ? <span className="required-symbol">* </span> : null}
                {overlay}
            </label>
        );
    }
}
