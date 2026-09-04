/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { act, renderHook } from '@testing-library/react';

import { useDisableableInput } from './DisableableInput';

describe('DisableableInput', () => {
    describe('useDisableableInput', () => {
        test('inputValue only reflects local edits when allowDisable is true', () => {
            const disableable = renderHook(() =>
                useDisableableInput<string>({ allowDisable: true, value: 'fromProps' })
            );

            expect(disableable.result.current.inputValue).toBe('fromProps');

            act(() => {
                disableable.result.current.setInputValue('edited');
            });

            expect(disableable.result.current.inputValue).toBe('edited');

            // Without allowDisable the value from props always wins, mirroring DisableableInput.getInputValue()
            const notDisableable = renderHook(() => useDisableableInput<string>({ value: 'fromProps' }));

            act(() => {
                notDisableable.result.current.setInputValue('edited');
            });

            expect(notDisableable.result.current.inputValue).toBe('fromProps');
        });

        test('localValue reports local edits whether or not allowDisable is set', () => {
            const disableable = renderHook(() =>
                useDisableableInput<string>({ allowDisable: true, value: 'fromProps' })
            );
            const notDisableable = renderHook(() => useDisableableInput<string>({ value: 'fromProps' }));

            expect(disableable.result.current.localValue).toBe('fromProps');
            expect(notDisableable.result.current.localValue).toBe('fromProps');

            act(() => {
                disableable.result.current.setInputValue('edited');
            });
            act(() => {
                notDisableable.result.current.setInputValue('edited');
            });

            expect(disableable.result.current.localValue).toBe('edited');

            // Where inputValue falls back to the value from props, localValue still reports the edit
            expect(notDisableable.result.current.inputValue).toBe('fromProps');
            expect(notDisableable.result.current.localValue).toBe('edited');

            // Disabling discards the edit, so localValue tracks the value the input reverts to
            act(() => {
                disableable.result.current.toggleDisabled();
            });

            expect(disableable.result.current.localValue).toBe('fromProps');
        });

        test('discards local edits when the input is disabled', () => {
            const { result } = renderHook(() =>
                useDisableableInput<string>({ allowDisable: true, value: 'fromProps' })
            );

            act(() => {
                result.current.setInputValue('edited');
            });

            expect(result.current.inputValue).toBe('edited');

            // Disabling reverts to the value from props ...
            act(() => {
                result.current.toggleDisabled();
            });

            expect(result.current.isDisabled).toBe(true);
            expect(result.current.inputValue).toBe('fromProps');

            // ... and re-enabling does not resurrect the discarded edit
            act(() => {
                result.current.toggleDisabled();
            });

            expect(result.current.isDisabled).toBe(false);
            expect(result.current.inputValue).toBe('fromProps');
        });

        test('preserves a null local edit, falling back to props only for undefined', () => {
            // FileInput uses null to mean "the attached file was removed", so a null edit must not be treated as
            // an absent edit the way undefined is.
            const { result } = renderHook(() =>
                useDisableableInput<null | string>({ allowDisable: true, value: 'attachedFile.txt' })
            );

            act(() => {
                result.current.setInputValue(null);
            });

            expect(result.current.inputValue).toBeNull();

            act(() => {
                result.current.setInputValue(undefined);
            });

            expect(result.current.inputValue).toBe('attachedFile.txt');
        });

        test('notifies onToggleDisable with the new disabled state', () => {
            const onToggleDisable = jest.fn();
            const { result } = renderHook(() =>
                useDisableableInput<string>({
                    allowDisable: true,
                    initiallyDisabled: true,
                    onToggleDisable,
                    value: 'fromProps',
                })
            );

            // initiallyDisabled seeds the state without notifying
            expect(result.current.isDisabled).toBe(true);
            expect(onToggleDisable).not.toHaveBeenCalled();

            act(() => {
                result.current.toggleDisabled();
            });

            expect(result.current.isDisabled).toBe(false);
            expect(onToggleDisable).toHaveBeenLastCalledWith(false);

            act(() => {
                result.current.toggleDisabled();
            });

            expect(result.current.isDisabled).toBe(true);
            expect(onToggleDisable).toHaveBeenLastCalledWith(true);
            expect(onToggleDisable).toHaveBeenCalledTimes(2);
        });
    });
});
