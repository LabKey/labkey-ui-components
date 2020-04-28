import React, { PureComponent, ReactNode } from 'react';

import { SVGIcon, Theme } from '../../..';

import { LineageNode } from '../models';

export interface DetailHeaderProps {
    header: ReactNode;
    iconSrc: string;
}

export class DetailHeader extends PureComponent<DetailHeaderProps> {
    render() {
        const { children, header, iconSrc } = this.props;

        return (
            <div className="margin-bottom lineage-node-detail">
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
    render() {
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
                    <a className="lineage-data-link-left" href={node.links.overview}>
                        <span className="lineage-data-link--text">Overview</span>
                    </a>
                    {lineageUrl !== undefined && (
                        <a className="lineage-data-link-right" href={lineageUrl}>
                            <span className="lineage-data-link--text">Lineage</span>
                        </a>
                    )}
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
