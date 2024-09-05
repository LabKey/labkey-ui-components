import React, { PropsWithChildren, PureComponent, ReactNode } from 'react';

import { LineageNode } from '../models';
import { LineageDataLink } from '../LineageDataLink';
import { SVGIcon, Theme } from '../../base/SVGIcon';

export interface DetailHeaderProps extends PropsWithChildren {
    header: ReactNode;
    iconSrc: string;
}

export class DetailHeader extends PureComponent<DetailHeaderProps> {
    render(): ReactNode {
        const { children, header, iconSrc } = this.props;

        return (
            <div className="lineage-detail-header margin-bottom">
                <i className="component-detail--child--img">
                    <SVGIcon theme={Theme.ORANGE} iconSrc={iconSrc} height="50px" width="50px" />
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">{header}</h4>
                    </div>
                    <div className="small">{children}</div>
                </div>
            </div>
        );
    }
}

export interface NodeDetailHeaderProps {
    node: LineageNode;
    seed?: string;
}

export class NodeDetailHeader extends PureComponent<NodeDetailHeaderProps> {
    render(): ReactNode {
        const { node, seed } = this.props;
        const { links, meta, name } = node;
        const lineageUrl = links.lineage;
        const isSeed = seed === node.lsid;

        const aliases = meta?.aliases;
        const description = meta?.description;
        const displayType = meta?.displayType;

        const header = (
            <>
                {(lineageUrl && !isSeed && <a href={lineageUrl}>{name}</a>) || name}
                <div className="pull-right">
                    <LineageDataLink href={node.links.overview}>Overview</LineageDataLink>
                    <LineageDataLink href={lineageUrl}>Lineage</LineageDataLink>
                </div>
            </>
        );

        return (
            <DetailHeader header={header} iconSrc={node.iconProps.iconURL}>
                {displayType && <div>{displayType}</div>}
                {aliases && <div>{aliases.join(', ')}</div>}
                {description && <div title={description}>{description}</div>}
            </DetailHeader>
        );
    }
}
