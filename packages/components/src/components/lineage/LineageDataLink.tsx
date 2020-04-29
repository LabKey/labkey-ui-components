import React, { AnchorHTMLAttributes, DetailedHTMLProps, PureComponent, ReactNode } from 'react';

export class LineageDataLink extends PureComponent<
    DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> {
    static defaultProps = {
        className: 'show-on-hover lineage-data-link',
    };

    render(): ReactNode {
        const { children, href, onClick } = this.props;

        if (!href && !onClick) {
            return null;
        }

        return (
            <a {...this.props}>
                <span className="lineage-data-link--text">{children}</span>
            </a>
        );
    }
}
