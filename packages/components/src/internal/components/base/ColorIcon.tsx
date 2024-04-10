import React, { PureComponent, ReactNode } from 'react';

interface Props {
    asSquare?: boolean;
    cls?: string;
    label?: ReactNode;
    useSmall?: boolean;
    value: string;
}

export class ColorIcon extends PureComponent<Props> {
    render(): ReactNode {
        const { cls, value, asSquare, label, useSmall } = this.props;

        let iconCls = cls;
        if (!iconCls) {
            iconCls = asSquare ? 'color-picker__chip' : 'color-icon__circle';
            if (useSmall) iconCls += '-small';
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
