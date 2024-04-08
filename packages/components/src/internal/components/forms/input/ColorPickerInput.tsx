import React, { PureComponent, ReactNode } from 'react';
import { ColorResult, CompactPicker } from 'react-color';
import classNames from 'classnames';

import { ColorIcon } from '../../base/ColorIcon';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';

interface Props {
    allowRemove?: boolean;
    colors?: string[];
    disabled?: boolean;
    name?: string;
    onChange: (name: string, value: string) => void;
    text?: string;
    value: string;
}

interface State {
    showPicker: boolean;
}

export class ColorPickerInput extends PureComponent<Props, State> {
    state: Readonly<State> = {
        showPicker: false,
    };

    onChange = (color?: ColorResult): void => {
        this.props.onChange(this.props.name, color?.hex);
    };

    togglePicker = (): void => {
        this.setState(state => ({ showPicker: !state.showPicker }));
    };

    render(): ReactNode {
        const { colors, disabled, text, value, allowRemove } = this.props;
        const { showPicker } = this.state;
        const iconClassName = classNames('fa', { 'fa-caret-up': showPicker, 'fa-caret-down': !showPicker });
        const showChip = text !== undefined;

        return (
            <div className="color-picker">
                <button
                    type="button"
                    className="color-picker__button btn btn-default"
                    onClick={this.togglePicker}
                    disabled={disabled}
                >
                    {text ? (
                        text
                    ) : value ? (
                        <ColorIcon cls="color-picker__chip-small" asSquare={true} value={value} />
                    ) : (
                        'None'
                    )}
                    <i className={iconClassName} />
                </button>

                {showChip && <ColorIcon cls="color-picker__chip" asSquare={true} value={value} />}

                {allowRemove && value && (
                    <RemoveEntityButton onClick={() => this.onChange()} labelClass="color-picker__remove" />
                )}

                <div className="color-picker__picker">
                    {showPicker && (
                        <>
                            <div className="color-picker__mask" onClick={this.togglePicker} />
                            <CompactPicker onChangeComplete={this.onChange} color={value} colors={colors} />
                        </>
                    )}
                </div>
            </div>
        );
    }
}
