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
});
