import React, { PureComponent, ReactNode } from "react";

interface Props {
    cls?: string;
    value: string;
    asSquare?: boolean;
}

export class ColorIcon extends PureComponent<Props> {
    render(): ReactNode {
        const { cls, value, asSquare } = this.props;
        const isWhite = value?.toLowerCase() === '#ffffff';
        const border = isWhite ? 'solid 1px #000000' : undefined;

        if (asSquare) {
            return <i className={cls} style={{ backgroundColor: value, border }} />;
        }

        if (isWhite) {
            return <i className="fa fa-circle-thin" />;
        }

        return <i className="fa fa-circle" style={{ color: value }} />;
    }
}
