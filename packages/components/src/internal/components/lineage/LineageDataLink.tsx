import React, { AnchorHTMLAttributes, DetailedHTMLProps, PureComponent, ReactNode } from 'react';

export class LineageDataLink extends PureComponent<
    DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> {
    render(): ReactNode {
        const { children, href, onClick } = this.props;

        if (!href && !onClick) {
            return null;
        }

        return (
            <a {...this.props} className="show-on-hover lineage-data-link lineage-data-link--text">
                {children}
            </a>
        );
    }
}
