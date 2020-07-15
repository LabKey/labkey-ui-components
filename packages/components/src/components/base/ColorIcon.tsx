import React, { PureComponent, ReactNode } from 'react';

interface Props {
    cls?: string;
    value: string;
    asSquare?: boolean;
    label?: string;
}

export class ColorIcon extends PureComponent<Props> {
    static defaultProps = {
        cls: 'color-picker__chip',
    };

    render(): ReactNode {
        const { cls, value, asSquare, label } = this.props;

        let icon;
        if (value) {
            if (asSquare) {
                icon = <i className={cls} style={{ backgroundColor: value }} />;
            } else {
                icon = <i className="color-icon__circle" style={{ backgroundColor: value }} />;
            }
        }

        return (
            <>
                {icon}
                {label && <span className={value ? 'spacer-left' : undefined}>{label}</span>}
            </>
        );
    }
}
