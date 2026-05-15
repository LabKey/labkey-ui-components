import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';

import { LineageNode } from '../models';
import { LineageDataLink } from '../LineageDataLink';
import { SVGIcon, Theme } from '../../base/SVGIcon';
import { QueryModel } from '../../../../public/QueryModel/QueryModel';
import { caseInsensitive, hasIdentifiedCol } from '../../../util/utils';
import { UnidentifiedPill } from '../../../UnidentifiedPill';
import { IDENTIFIED_COLUMN_NAME } from '../constants';

export interface DetailHeaderProps extends PropsWithChildren {
    header: ReactNode;
    iconSrc: string;
}

export const DetailHeader: FC<DetailHeaderProps> = memo(({ children, header, iconSrc }) => (
    <div className="lineage-detail-header margin-bottom">
        <i className="component-detail--child--img">
            <SVGIcon height="50px" iconSrc={iconSrc} theme={Theme.ORANGE} width="50px" />
        </i>
        <div className="text__truncate">
            <div className="lineage-name">
                <div className="no-margin-top lineage-name-data">{header}</div>
            </div>
            <div className="small">{children}</div>
        </div>
    </div>
));
DetailHeader.displayName = 'DetailHeader';

export interface NodeDetailHeaderProps {
    model: QueryModel;
    node: LineageNode;
    seed?: string;
}

export const NodeDetailHeader: FC<NodeDetailHeaderProps> = memo(({ model, node, seed }) => {
    const { links, meta, name } = node;
    const lineageUrl = links.lineage;
    const isSeed = seed === node.lsid;

    const displayType = meta?.displayType;
    let identified: boolean;

    if (model && !model.isLoading && !model.hasLoadErrors && hasIdentifiedCol(model.schemaQuery)) {
        identified = caseInsensitive(model.getRow(), IDENTIFIED_COLUMN_NAME)?.value;
    }

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
            {/* Triple eq is important here; we only want false, not falsey values */}
            {identified === false && <UnidentifiedPill schemaQuery={model.schemaQuery} />}
            {displayType && <div>{displayType}</div>}
        </DetailHeader>
    );
});
NodeDetailHeader.displayName = 'NodeDetailHeader';
