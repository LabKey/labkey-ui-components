/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { QueryColumn } from '../../../../public/QueryColumn';
import { Formsy } from '../formsy';
import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';

import { TextInput, TextInputProps } from './TextInput';

const COLUMN = new QueryColumn({ caption: 'Extra Test Column', fieldKey: 'extraTestColumn', name: 'extraTestColumn' });
const REQUIRED_COLUMN = COLUMN.mutate({ required: true });

const ENABLED_FIELD_SELECTOR = `input[name="${COLUMN.fieldKey}::enabled"]`;
const TEXT_INPUT_SELECTOR = 'input[type="text"]';

function renderInForm(props?: Partial<TextInputProps>): RenderResult {
    return render(
        <Formsy>
            <TextInput queryColumn={COLUMN} {...props} />
        </Formsy>
    );
}

function textInput(): HTMLInputElement {
    return document.querySelector(TEXT_INPUT_SELECTOR);
}

function clickToggle(): Promise<void> {
    return userEvent.click(document.querySelector('.control-label-toggle-input button:last-child'));
}

describe('TextInput', () => {
    describe('label', () => {
        test('renders the column caption by default', () => {
            const { container } = renderInForm();

            const label = container.querySelector('label');
            expect(label).toHaveTextContent('Extra Test Column');
            expect(label).toHaveClass(...INPUT_LABEL_CLASS_NAME.split(' '));
            // With a visible label the input is labeled by the <label>, so aria-label would be redundant
            expect(textInput()).not.toHaveAttribute('aria-label');
        });

        // The Formsy Control drops the <label> entirely when it is given a null label for an optional column, so the
        // input carries its accessible name itself, and the wrapper takes the offset the label would have occupied
        test('drops the label but keeps the input accessible when showLabel is false', () => {
            const { container } = renderInForm({ showLabel: false });

            expect(container.querySelector('label')).not.toBeInTheDocument();
            expect(textInput()).toHaveAttribute('aria-label', 'Extra Test Column');
            expect(container.querySelector('.offset-sm-3')).toBeInTheDocument();
        });

        // A required column still needs somewhere to hang its asterisk, which is the only case where the
        // hide-label class is actually used
        test('keeps a hidden label carrying the asterisk when showLabel is false for a required column', () => {
            const { container } = renderInForm({ queryColumn: REQUIRED_COLUMN, showLabel: false });

            const label = container.querySelector('label');
            expect(label).toHaveClass('hide-label');
            expect(label).toHaveTextContent('*');
            expect(textInput()).toHaveAttribute('aria-label', 'Extra Test Column');
        });

        test('renders a caller-supplied label in place of the FieldLabel', () => {
            const renderFieldLabel = jest.fn().mockReturnValue(<span className="custom-label">Custom</span>);
            const { container } = renderInForm({ renderFieldLabel });

            expect(renderFieldLabel).toHaveBeenCalledWith(COLUMN);
            expect(container.querySelector('.custom-label')).toBeInTheDocument();
            // FieldLabel's overlay is bypassed entirely
            expect(container.querySelector('.overlay-trigger')).not.toBeInTheDocument();
        });

        test('renders the required asterisk for a required column', () => {
            const { container } = renderInForm({ queryColumn: REQUIRED_COLUMN });

            expect(container.querySelector('label')).toHaveTextContent('*');
            expect(textInput()).toBeRequired();
        });

        // QueryFormInputs mutates the column to non-required when checkRequiredFields is false, so the asterisk
        // has to come from the label overlay instead of the Formsy Control
        test('renders the asterisk without requiring the input when addLabelAsterisk is set', () => {
            const { container } = renderInForm({ addLabelAsterisk: true });

            expect(container.querySelector('label')).toHaveTextContent('*');
            expect(textInput()).not.toBeRequired();
        });
    });

    describe('input attributes', () => {
        test('derives id from the field key and leaves name unencoded', () => {
            const column = COLUMN.mutate({ fieldKey: 'Lookup/Field', name: 'Lookup/Field' });
            const { container } = renderInForm({ queryColumn: column });

            expect(textInput()).toHaveAttribute('id', 'Lookup-Field');
            expect(textInput()).toHaveAttribute('name', 'Lookup/Field');
            expect(container.querySelector('label')).toHaveAttribute('for', 'Lookup-Field');
        });

        test('honors a caller-supplied id', () => {
            renderInForm({ id: 'my-own-id' });

            expect(textInput()).toHaveAttribute('id', 'my-own-id');
        });

        test('applies the default wrapper and label class names', () => {
            const { container } = renderInForm();

            expect(container.querySelector(`.${INPUT_WRAPPER_CLASS_NAME.split(' ').join('.')}`)).toBeInTheDocument();
            expect(container.querySelector('label')).toHaveClass(...INPUT_LABEL_CLASS_NAME.split(' '));
        });

        test('forwards the input type', () => {
            renderInForm({ type: 'number' });

            expect(document.querySelector('input')).toHaveAttribute('type', 'number');
        });

        test('placeholder prompts for the caption', () => {
            renderInForm();

            expect(textInput()).toHaveAttribute('placeholder', 'Enter extra test column');
        });

        test('placeholder reports a mixed value only while disabled', () => {
            const { unmount } = renderInForm({ hasMixedValue: true });
            expect(textInput()).toHaveAttribute('placeholder', 'Enter extra test column');
            unmount();

            renderInForm({ disabled: true, hasMixedValue: true });
            expect(textInput()).toHaveAttribute('placeholder', MIXED_VALUE_DISPLAY);
        });

        test('focuses the input when startFocused is set', () => {
            const { unmount } = renderInForm();
            expect(textInput()).not.toHaveFocus();
            unmount();

            renderInForm({ startFocused: true });
            expect(textInput()).toHaveFocus();
        });
    });

    describe('help text', () => {
        const NAME_EXPRESSION_COLUMN = COLUMN.mutate({ nameExpression: 'S-${genId}' });

        test('explains that a name expression will generate a value on insert', () => {
            const { container } = renderInForm({ queryColumn: NAME_EXPRESSION_COLUMN });

            expect(container).toHaveTextContent('A Extra Test Column will be generated if one is not given.');
        });

        // Issue 52367: a name expression does not re-run on update, so the value is not generated
        test('omits the message when updating', () => {
            const { container } = renderInForm({ isUpdate: true, queryColumn: NAME_EXPRESSION_COLUMN });

            expect(container).not.toHaveTextContent('will be generated');
        });

        test('omits the message for a column without a name expression', () => {
            const { container } = renderInForm();

            expect(container).not.toHaveTextContent('will be generated');
        });
    });

    describe('onChange', () => {
        test('reports the field key and the new value', async () => {
            const onChange = jest.fn();
            renderInForm({ onChange });

            await userEvent.type(textInput(), 'ab');

            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenLastCalledWith(COLUMN.fieldKey, 'ab');
        });
    });

    describe('internal spaces warning', () => {
        test('warns once the value contains repeated internal spaces', async () => {
            const { container } = renderInForm({ includeSpacesWarning: true });
            expect(container).not.toHaveTextContent('contains multiple spaces');

            await userEvent.type(textInput(), 'a  b');

            expect(textInput()).toHaveValue('a  b');
            expect(container).toHaveTextContent('This name contains multiple spaces between words.');
        });

        test('stays silent when not requested', async () => {
            const { container } = renderInForm();

            await userEvent.type(textInput(), 'a  b');

            expect(container).not.toHaveTextContent('contains multiple spaces');
        });
    });

    describe('disabling', () => {
        test('disables the input when disabled is set', () => {
            renderInForm({ disabled: true });

            expect(textInput()).toBeDisabled();
        });

        test('renders no toggle unless allowDisable is set', () => {
            const { container } = renderInForm();

            expect(container.querySelector('.control-label-toggle-input')).not.toBeInTheDocument();
            expect(container.querySelector(ENABLED_FIELD_SELECTOR)).not.toBeInTheDocument();
        });

        test('starts disabled when initiallyDisabled is set', () => {
            const { container } = renderInForm({ allowDisable: true, initiallyDisabled: true });

            expect(textInput()).toBeDisabled();
            expect(container.querySelector('.fa-toggle-off')).toBeInTheDocument();
            expect(container.querySelector(ENABLED_FIELD_SELECTOR)).toHaveAttribute('value', 'false');
        });

        test('discards local edits when the field is toggled off', async () => {
            const onToggleDisable = jest.fn();
            const { container } = renderInForm({ allowDisable: true, onToggleDisable, value: 'fromProps' });

            expect(textInput()).toBeEnabled();
            expect(container.querySelector('.fa-toggle-on')).toBeInTheDocument();
            expect(container.querySelector(ENABLED_FIELD_SELECTOR)).toHaveAttribute('value', 'true');

            await userEvent.clear(textInput());
            await userEvent.type(textInput(), 'edited');
            expect(textInput()).toHaveValue('edited');

            await clickToggle();

            expect(onToggleDisable).toHaveBeenLastCalledWith(true);
            expect(textInput()).toBeDisabled();
            expect(textInput()).toHaveValue('fromProps');
            expect(container.querySelector(ENABLED_FIELD_SELECTOR)).toHaveAttribute('value', 'false');
        });
    });
});
