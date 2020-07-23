import React, { PureComponent, ReactNode } from 'react';

interface Props {
    cls?: string;
    value: string;
    asSquare?: boolean;
    label?: string;
    useSmall?: boolean
}

export class ColorIcon extends PureComponent<Props> {
    render(): ReactNode {
        const { cls, value, asSquare, label, useSmall } = this.props;

        let iconCls = cls;
        if (!iconCls) {
            iconCls = asSquare ? 'color-picker__chip' : 'color-icon__circle';
            if (useSmall)
                iconCls += '-small';
        }

        let icon;
        if (value) {
            icon = <i className={iconCls} style={{ backgroundColor: value }} />;
        }

        return (
            <>
                {icon}
                {label && <span className={value ? 'spacer-left' : undefined}>{label}</span>}
            </>
        );
    }
}
