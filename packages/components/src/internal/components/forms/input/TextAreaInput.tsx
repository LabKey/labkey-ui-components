/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { FormsyTextArea, FormsyTextAreaProps } from './FormsyReactComponents';
import { stringToHtmlId } from '../../../util/utils';

interface TextAreaInputProps extends DisableableInputProps, Omit<FormsyTextAreaProps, 'onChange'> {
    addLabelAsterisk?: boolean;
    onChange?: (value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
}

export class TextAreaInput extends DisableableInput<TextAreaInputProps, DisableableInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            cols: 50,
            elementWrapperClassName: INPUT_WRAPPER_CLASS_NAME,
            labelClassName: `${INPUT_LABEL_CLASS_NAME} textarea-control-label`,
            rows: 5,
            showLabel: true,
        },
    };

    constructor(props: TextAreaInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: props.initiallyDisabled,
        };
    }

    renderLabel() {
        const { label, queryColumn, showLabel, allowDisable, addLabelAsterisk, renderFieldLabel } = this.props;
        const { isDisabled } = this.state;

        if (renderFieldLabel) {
            return renderFieldLabel(queryColumn);
        }

        // This is here (at least for now) because of the use of the hide-label class below
        // in place of sending showLabel=false???
        if (showLabel === false) {
            return null;
        }
        return (
            <FieldLabel
                column={queryColumn}
                isDisabled={isDisabled}
                label={label}
                labelOverlayProps={{ isFormsy: true, addLabelAsterisk }}
                showLabel={showLabel}
                showToggle={allowDisable}
                toggleProps={{
                    onClick: this.toggleDisabled,
                }}
            />
        );
    }

    onChange = (name, value): void => {
        if (this.props.allowDisable) {
            this.setState({ inputValue: value });
        }

        this.props.onChange?.(value);
    };

    render() {
        // Extract DisableableInputProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { allowDisable, initiallyDisabled, onToggleDisable, hasMixedValue, ...rest } = this.props;
        // Extract TextAreaInputProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { addLabelAsterisk, onChange, queryColumn, renderFieldLabel, showLabel, ...textAreaProps } = rest;
        const { labelClassName } = textAreaProps;

        return (
            <FormsyTextArea
                aria-label={showLabel ? undefined : queryColumn.caption}
                id={stringToHtmlId(queryColumn.fieldKey)}
                name={queryColumn.fieldKey}
                placeholder={
                    hasMixedValue && this.state.isDisabled
                        ? MIXED_VALUE_DISPLAY
                        : `Enter ${queryColumn.caption.toLowerCase()}`
                }
                required={queryColumn.required}
                {...textAreaProps}
                disabled={this.state.isDisabled}
                label={this.renderLabel()}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                onChange={this.onChange}
                value={this.getInputValue()}
            />
        );
    }
}
