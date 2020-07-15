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
        const isWhite = value?.toLowerCase() === '#ffffff';
        const border = isWhite ? 'solid 1px #000000' : undefined;

        let icon;
        if (value) {
            if (asSquare) {
                icon = <i className={cls} style={{ backgroundColor: value, border }} />;
            } else {
                icon = <i className="fa fa-circle" style={{ color: value }} />;
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
