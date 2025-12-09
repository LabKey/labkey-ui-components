import React, { FC, memo, useCallback, useRef, useState } from 'react';
import { ColorResult, CompactPicker } from 'react-color';
import classNames from 'classnames';

import { ColorIcon } from '../../base/ColorIcon';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';

const DEFAULT_COLORS = [
    '#FFFFFF',
    '#F07575',
    '#F4AE71',
    '#F0E075',
    '#E3F075',
    '#A8E477',
    '#7FF0C3',
    '#81C6E9',
    '#AC8EEB',
    '#D983EC',
    '#EE96BC',
    '#D6C1A4',
    '#BFBFBF',
    '#EA4545',
    '#EC7812',
    '#E3C919',
    '#BCCF17',
    '#6BC026',
    '#1ADB8E',
    '#269BD6',
    '#7C4DE0',
    '#B921DB',
    '#E1478A',
    '#BB9868',
    '#808080',
    '#D11717',
    '#D26B10',
    '#DCB118',
    '#A9B314',
    '#589E1F',
    '#16BB79',
    '#2084B6',
    '#5B25D0',
    '#961BB1',
    '#B81E61',
    '#8D6C3F',
    '#404040',
    '#A11212',
    '#AF590D',
    '#AA8813',
    '#868E10',
    '#4A841A',
    '#13A067',
    '#1B6E98',
    '#481DA5',
    '#7C1692',
    '#95184E',
    '#745934',
    '#000000',
    '#7C0E0E',
    '#8A460A',
    '#8A6E0F',
    '#6C730D',
    '#396614',
    '#108456',
    '#175E82',
    '#351579',
    '#651278',
    '#72133C',
    '#634C2C',
];

interface Props {
    allowRemove?: boolean;
    colors?: string[];
    disabled?: boolean;
    name?: string;
    onChange: (name: string, value: string) => void;
    placeholder?: string;
    text?: string;
    value: string;
}

export const ColorPickerInput: FC<Props> = memo(props => {
    const {
        allowRemove,
        colors = DEFAULT_COLORS,
        disabled,
        name,
        onChange,
        text,
        value,
        placeholder = 'None',
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
        <div className="color-picker" data-name={name}>
            <button
                type="button"
                className="color-picker__button btn btn-default"
                onClick={togglePicker}
                disabled={disabled}
                ref={buttonRef}
            >
                {text ? (
                    text
                ) : value ? (
                    <ColorIcon cls="color-picker__chip-small" asSquare value={value_} />
                ) : (
                    <span className="color-picker__placeholder">{placeholder}</span>
                )}
                <i className={classNames('fa fa-lg', { 'fa-angle-up': showPicker, 'fa-angle-down': !showPicker })} />
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
