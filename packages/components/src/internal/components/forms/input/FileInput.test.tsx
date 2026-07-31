/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Map } from 'immutable';

import { QueryColumn } from '../../../../public/QueryColumn';
import { Formsy } from '../formsy';
import { INPUT_LABEL_CLASS_NAME_WITH_TOGGLE, MIXED_VALUE_DISPLAY } from '../constants';

import { FileInput, FileInputProps, initializeValue } from './FileInput';

const FILE_COLUMN = new QueryColumn({
    caption: 'Attached File',
    fieldKey: 'attachedFile',
    inputType: 'file',
    name: 'attachedFile',
});

const REQUIRED_FILE_COLUMN = FILE_COLUMN.mutate({ required: true }) as QueryColumn;

interface FormsyResult extends RenderResult {
    onChange: jest.Mock;
    onInvalid: jest.Mock;
    onValid: jest.Mock;
}

function renderInForm(props?: Partial<FileInputProps>): FormsyResult {
    const onChange = jest.fn();
    const onInvalid = jest.fn();
    const onValid = jest.fn();

    const result = render(
        <Formsy onChange={onChange} onInvalid={onInvalid} onValid={onValid}>
            <FileInput formsy name={FILE_COLUMN.fieldKey} queryColumn={REQUIRED_FILE_COLUMN} {...props} />
        </Formsy>
    );

    return { ...result, onChange, onInvalid, onValid };
}

function selectFile(): Promise<void> {
    return userEvent.upload(
        document.querySelector('input[type="file"]'),
        new File(['file contents'], 'attachment.txt', { type: 'text/plain' })
    );
}

const ENABLED_FIELD_SELECTOR = `input[name="${FILE_COLUMN.fieldKey}::enabled"]`;
const FILE_INPUT_SELECTOR = 'input[type="file"]';

function clickToggle(): Promise<void> {
    return userEvent.click(document.querySelector('.toggle-group-icon button'));
}

// FieldLabel sizes the label/toggle columns for a disableable input by mutating the labelOverlayProps it is given
function expectToggleLayout(container: HTMLElement): void {
    expect(container.querySelector('.control-label')).toHaveClass(INPUT_LABEL_CLASS_NAME_WITH_TOGGLE);
    expect(container.querySelector('.control-label-toggle-input')).toHaveClass('control-label-toggle-input-size-fixed');
}

function expectEnabled(container: HTMLElement): void {
    expectToggleLayout(container);
    expect(container.querySelector('.fa-toggle-on')).toBeInTheDocument();
    expect(container.querySelector('.fa-toggle-off')).not.toBeInTheDocument();
    expect(container.querySelector(ENABLED_FIELD_SELECTOR)).toHaveAttribute('value', 'true');
    expect(container.querySelector(FILE_INPUT_SELECTOR)).toBeEnabled();
    expect(container.querySelector('.file-upload--compact-label')).not.toHaveClass('file-upload--is-disabled');
}

function expectDisabled(container: HTMLElement): void {
    expectToggleLayout(container);
    expect(container.querySelector('.fa-toggle-off')).toBeInTheDocument();
    expect(container.querySelector('.fa-toggle-on')).not.toBeInTheDocument();
    expect(container.querySelector(ENABLED_FIELD_SELECTOR)).toHaveAttribute('value', 'false');
    expect(container.querySelector(FILE_INPUT_SELECTOR)).toBeDisabled();
    expect(container.querySelector('.file-upload--compact-label')).toHaveClass('file-upload--is-disabled');
}

describe('FileInput', () => {
    test('initializeValue', () => {
        expect(initializeValue(undefined)).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue(null)).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('')).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('   ')).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('  some/file/path1 ')).toEqual({
            data: 'some/file/path1',
            formValue: 'some/file/path1',
        });
        expect(initializeValue(Map())).toEqual({ data: Map(), formValue: undefined });
        expect(initializeValue(Map({ path: 'some/file/path' }))).toEqual({
            data: Map({ path: 'some/file/path' }),
            formValue: undefined,
        });
        expect(initializeValue(Map({ value: 'some/file/path' }))).toEqual({
            data: Map({ value: 'some/file/path' }),
            formValue: 'some/file/path',
        });
    });

    describe('required', () => {
        test('invalidates the form when a required field does not have a value', async () => {
            const { container, onInvalid, onValid } = renderInForm();

            expect(onInvalid).toHaveBeenCalled();
            expect(onValid).not.toHaveBeenCalled();
            expect(container.querySelector('.required-symbol')).toBeInTheDocument();

            // Selecting a file supplies the value the "required" validation is looking for
            await selectFile();

            expect(onValid).toHaveBeenCalled();
        });

        test('does not invalidate the form when the field is not required', () => {
            const { container, onInvalid, onValid } = renderInForm({ queryColumn: FILE_COLUMN });

            expect(onValid).toHaveBeenCalled();
            expect(onInvalid).not.toHaveBeenCalled();
            expect(container.querySelector('.required-symbol')).not.toBeInTheDocument();
        });

        test('respects the "required" prop when a queryColumn is not supplied', () => {
            const { onInvalid, onValid } = renderInForm({ queryColumn: undefined, required: true });

            expect(onInvalid).toHaveBeenCalled();
            expect(onValid).not.toHaveBeenCalled();
        });

        test('an initial value satisfies a required field without dirtying the form', () => {
            const { onChange, onInvalid, onValid } = renderInForm({
                initialValue: Map({ value: 'some/file/path.txt' }),
            });

            expect(onValid).toHaveBeenCalled();
            expect(onInvalid).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();
        });

        test('invalidates the form when the value of a required field is removed', async () => {
            const { container, onInvalid, onValid } = renderInForm({ initialValue: 'some/file/path.txt' });

            expect(onValid).toHaveBeenCalled();
            expect(onInvalid).not.toHaveBeenCalled();

            await userEvent.click(container.querySelector('.attached-file__remove-icon'));

            expect(onInvalid).toHaveBeenCalled();
        });
    });

    describe('disabled state', () => {
        const DISABLEABLE_PROPS: Partial<FileInputProps> = { allowDisable: true, queryColumn: FILE_COLUMN };

        test('does not render a toggle when allowDisable is not specified', () => {
            const { container } = renderInForm({ queryColumn: FILE_COLUMN });

            expect(container.querySelector('.toggle-group-icon')).not.toBeInTheDocument();
            expect(container.querySelector(ENABLED_FIELD_SELECTOR)).not.toBeInTheDocument();
            expect(container.querySelector(FILE_INPUT_SELECTOR)).toBeEnabled();
        });

        test('renders an enabled field when allowDisable', () => {
            const { container } = renderInForm(DISABLEABLE_PROPS);
            expectEnabled(container);
        });

        test('renders a disabled field when initiallyDisabled', () => {
            const { container } = renderInForm({ ...DISABLEABLE_PROPS, initiallyDisabled: true });
            expectDisabled(container);
        });

        test('toggling notifies onToggleDisable with the new disabled state', async () => {
            const onToggleDisable = jest.fn();
            const { container } = renderInForm({ ...DISABLEABLE_PROPS, onToggleDisable });

            await clickToggle();

            expect(onToggleDisable).toHaveBeenLastCalledWith(true);
            expectDisabled(container);

            await clickToggle();

            expect(onToggleDisable).toHaveBeenLastCalledWith(false);
            expectEnabled(container);
            expect(onToggleDisable).toHaveBeenCalledTimes(2);
        });

        test('does not allow toggling when toggleDisabledTooltip is supplied', async () => {
            const onToggleDisable = jest.fn();
            const { container } = renderInForm({
                ...DISABLEABLE_PROPS,
                onToggleDisable,
                toggleDisabledTooltip: 'Cannot be updated',
            });

            expect(container.querySelector('.toggle-group-icon')).toHaveClass('disabled');
            expect(container.querySelector('.label-help-target')).toBeInTheDocument();

            await clickToggle();

            expect(onToggleDisable).not.toHaveBeenCalled();
            expectEnabled(container);
        });

        test('displays mixed values only while disabled', async () => {
            const { container } = renderInForm({ ...DISABLEABLE_PROPS, hasMixedValue: true, initiallyDisabled: true });

            expect(container.querySelector('.field__un-editable')).toHaveTextContent(MIXED_VALUE_DISPLAY);
            expect(container.querySelector('.fa-cloud-upload')).not.toBeInTheDocument();

            await clickToggle();

            expect(container.querySelector('.field__un-editable')).not.toBeInTheDocument();
            expect(container.querySelector('.fa-cloud-upload')).toBeInTheDocument();
        });

        test('retains a selected file when the field is subsequently disabled', async () => {
            const { container, onChange: onFormChange } = renderInForm(DISABLEABLE_PROPS);

            await selectFile();
            await clickToggle();

            // Disabling the field reverts local edits for editable inputs, but a selected file is retained
            expect(container.querySelector('.attached-file__inline-container')).toHaveTextContent('attachment.txt');
            expect(onFormChange).toHaveBeenLastCalledWith(
                expect.objectContaining({ [FILE_COLUMN.fieldKey]: expect.any(File) }),
                expect.anything()
            );
        });

        test('does not allow removing an existing attachment while disabled', async () => {
            const { container } = renderInForm({
                ...DISABLEABLE_PROPS,
                initialValue: Map({ value: 'some/file/path.txt' }),
                initiallyDisabled: true,
            });

            await userEvent.click(container.querySelector('.attachment-card__menu button'));
            expect(document.querySelector('.dropdown-menu')).not.toHaveTextContent('Remove');

            await clickToggle();
            await userEvent.click(container.querySelector('.attachment-card__menu button'));

            expect(document.querySelector('.dropdown-menu')).toHaveTextContent('Remove');
        });
    });
});
