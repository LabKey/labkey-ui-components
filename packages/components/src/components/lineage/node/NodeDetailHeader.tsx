import React, { PureComponent, ReactNode } from 'react';
import { SVGIcon, Theme } from '../../..';

export interface NodeDetailHeaderProps {
    header: ReactNode
    iconSrc: string
}

export class NodeDetailHeader extends PureComponent<NodeDetailHeaderProps> {

    render() {
        const { children, header, iconSrc } = this.props;

        return (
            <div className="margin-bottom lineage-node-detail">
                <i className="component-detail--child--img">
                    <SVGIcon
                        theme={Theme.ORANGE}
                        iconSrc={iconSrc}
                        height="50px"
                        width="50px"
                    />
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">
                            {header}
                        </h4>
                    </div>
                    {children}
                </div>
            </div>
        )
    }
}
