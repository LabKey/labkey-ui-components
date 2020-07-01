import React, { PureComponent, ReactNode } from 'react';
import { ColorResult, CompactPicker } from 'react-color';
import classNames from 'classnames';

interface Props {
    name?: string;
    onChange: (name: string, value: string) => void;
    text: string;
    value: string;
}

interface State {
    showPicker: boolean;
}

export class ColorPickerInput extends PureComponent<Props, State> {
    state: Readonly<State> = {
        showPicker: false,
    };

    onChange = (color: ColorResult): void => {
        this.props.onChange(this.props.name, color.hex);
        this.togglePicker();
    };

    togglePicker = (): void => {
        this.setState(state => ({ showPicker: !state.showPicker }));
    };

    render(): ReactNode {
        const { text, value } = this.props;
        const { showPicker } = this.state;
        const iconClassName = classNames('fa', { 'fa-caret-up': showPicker, 'fa-caret-down': !showPicker });

        return (
            <div className="color-picker">
                <button type="button" className="color-picker__button btn btn-default" onClick={this.togglePicker}>
                    {text}
                    <i className={iconClassName} />
                </button>

                <i className="color-picker__chip" style={{ backgroundColor: value }} />

                <div className="color-picker__picker">
                    {showPicker && (
                        <>
                            <div className="color-picker__mask" onClick={this.togglePicker} />
                            <CompactPicker onChangeComplete={this.onChange} color={value} />
                        </>
                    )}
                </div>
            </div>
        );
    }
}
