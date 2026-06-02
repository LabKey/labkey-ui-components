/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { QueryColumn } from '../../../../public/QueryColumn';
import { TextChoiceInput } from './TextChoiceInput';
import { SelectInput } from './SelectInput';

// Mock the SelectInput component since we want to verify its props
jest.mock('./SelectInput', () => ({
    SelectInput: jest.fn(() => null),
}));

describe('TextChoiceInput', () => {
    const DEFAULT_PROPS = {
        queryColumn: new QueryColumn({}),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function validateSelectInputOptions(options = []): void {
        expect(SelectInput).toHaveBeenCalledWith(
            expect.objectContaining({
                options,
            }),
            expect.any(Object)
        );
    }

    test('default props', () => {
        render(<TextChoiceInput {...DEFAULT_PROPS} />);
        validateSelectInputOptions();
    });

    test('placeholder', () => {
        render(<TextChoiceInput {...DEFAULT_PROPS} placeholder="testing" />);
        validateSelectInputOptions();

        expect(SelectInput).toHaveBeenCalledWith(
            expect.objectContaining({
                placeholder: 'testing',
            }),
            expect.any(Object)
        );
    });

    test('validValues, undefined', () => {
        render(<TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: undefined })} />);
        validateSelectInputOptions();
    });

    test('validValues, empty', () => {
        render(<TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: [] })} />);
        validateSelectInputOptions();
    });

    test('validValues, with values', () => {
        render(<TextChoiceInput {...DEFAULT_PROPS} queryColumn={new QueryColumn({ validValues: ['a', 'b', 'c'] })} />);
        validateSelectInputOptions([
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
            { label: 'c', value: 'c' },
        ]);
    });
});
