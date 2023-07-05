import { useCallback, KeyboardEvent } from 'react';

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

type KeyHandler = (evt: KeyboardEvent) => void;

/**
 * React hook useful for when you want to intercept enter and escape keys (e.g. for a text input where enter is save
 * and escape is cancel). Pass the result of this hook to the onKeyDown prop of an <input /> element.
 * @param onEnter: function to call when the enter key is pressed.
 * @param onEscape: function to call when the escape key is pressed.
 */
export const useEnterEscape = (onEnter?: () => void, onEscape?: () => void): any => {
    return useCallback(
        (evt: KeyboardEvent) => {
            if (evt.shiftKey || evt.metaKey) return;

            switch (evt.key) {
                case Key.ENTER:
                    evt.stopPropagation();
                    evt.preventDefault();
                    onEnter?.();
                    break;
                case Key.ESCAPE:
                    evt.stopPropagation();
                    evt.preventDefault();
                    onEscape?.();
                    break;
                default:
                    break;
            }
        },
        [onEnter, onEscape]
    );
};
