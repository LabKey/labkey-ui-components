import React, { FC, memo, useCallback, useState, useRef } from 'react';
import { ColorResult, CompactPicker } from 'react-color';
import classNames from 'classnames';

import { ColorIcon } from '../../base/ColorIcon';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';

interface Props {
    allowRemove?: boolean;
    colors?: string[];
    disabled?: boolean;
    name?: string;
    noValueText?: string;
    onChange: (name: string, value: string) => void;
    text?: string;
    value: string;
}

export const ColorPickerInput: FC<Props> = memo(props => {
    const {
        allowRemove,
        colors,
        disabled,
        name,
        onChange,
        text,
        value,
        noValueText = 'None',
    } = props;
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [fixedTop, setFixedTop] = useState<number>();
    const [fixedLeft, setFixedLeft] = useState<number>();
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const onChangeComplete = useCallback(
        (color?: ColorResult) => {
            onChange(name, color?.hex);
        },
        [name, onChange]
    );
    const onRemove = useCallback(() => {
        onChangeComplete();
    }, [onChangeComplete]);
    const togglePicker = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setFixedTop(rect.bottom + 5);
            setFixedLeft(rect.left);
        }

        setShowPicker(s => !s);
    }, []);

    // if value doesn't start with '#', add it
    const value_ = value && !value.startsWith('#') ? `#${value}` : value;

    const compactPicker = <CompactPicker onChangeComplete={onChangeComplete} color={value_} colors={colors} />;

    return (
        <div className="color-picker">
            <button
                type="button"
                className="color-picker__button btn btn-default"
                onClick={togglePicker}
                disabled={disabled}
                ref={buttonRef}
            >
                {text ? text : value ? <ColorIcon cls="color-picker__chip-small" asSquare value={value_} /> : noValueText}
                <i className={classNames('fa', { 'fa-caret-up': showPicker, 'fa-caret-down': !showPicker })} />
            </button>

            {text !== undefined && <ColorIcon cls="color-picker__chip" asSquare value={value_} />}

            {allowRemove && value_ && !disabled && (
                <RemoveEntityButton onClick={onRemove} labelClass="color-picker__remove" />
            )}

            <div className="color-picker__picker">
                {showPicker && (
                    <>
                        <div className="color-picker__mask" onClick={togglePicker} />
                        {fixedTop && fixedLeft ? (
                            <div style={{ position: 'fixed', top: fixedTop, left: fixedLeft }}>{compactPicker}</div>
                        ) : (
                            compactPicker
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

ColorPickerInput.displayName = 'ColorPickerInput';
