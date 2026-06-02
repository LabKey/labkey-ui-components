/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { KeyboardEventHandler, useCallback } from 'react';

/**
 * Enumeration of values for the KeyboardEvent.key
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
 */
export enum Key {
    ARROW_DOWN = 'ArrowDown',
    ARROW_LEFT = 'ArrowLeft',
    ARROW_RIGHT = 'ArrowRight',
    ARROW_UP = 'ArrowUp',
    BACKSPACE = 'Backspace',
    END = 'End',
    ENTER = 'Enter',
    ESCAPE = 'Escape',
    HOME = 'Home',
    TAB = 'Tab',
}

/**
 * React hook for when you want to intercept Enter and Escape keys (e.g., for a text input where Enter is to save
 * and Escape is to cancel). Pass the result of this hook to the onKeyDown prop of an <input /> element.
 * @param onEnter function to call when the Enter key is pressed.
 * @param onEscape function to call when the Escape key is pressed.
 * @param allowMultiSelect When false, if the shift-key or meta-key are pressed skip processing key event. Default is false.
 */
export function useEnterEscape<E = Element>(
    onEnter?: KeyboardEventHandler<E>,
    onEscape?: KeyboardEventHandler<E>,
    allowMultiSelect?: boolean
) {
    return useCallback<KeyboardEventHandler<E>>(
        evt => {
            if (!allowMultiSelect && (evt.shiftKey || evt.metaKey)) return;

            switch (evt.key) {
                case Key.ENTER:
                    evt.stopPropagation();
                    evt.preventDefault();
                    onEnter?.(evt);
                    break;
                case Key.ESCAPE:
                    evt.stopPropagation();
                    evt.preventDefault();
                    onEscape?.(evt);
                    break;
                default:
                    break;
            }
        },
        [allowMultiSelect, onEnter, onEscape]
    );
}

// For use with PureComponents that can't use the above hook
export function onEnterKeyDown<E = Element>(onEnter: KeyboardEventHandler<E>): KeyboardEventHandler<E> {
    return evt => {
        if (evt.shiftKey || evt.metaKey) return;

        switch (evt.key) {
            case Key.ENTER:
                evt.stopPropagation();
                evt.preventDefault();
                onEnter?.(evt);
                break;
        }
    };
}
