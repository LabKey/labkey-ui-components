import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';

import { LineageNode } from '../models';
import { LineageDataLink } from '../LineageDataLink';
import { SVGIcon, Theme } from '../../base/SVGIcon';
import { QueryModel } from '../../../../public/QueryModel/QueryModel';
import { caseInsensitive } from '../../../util/utils';
import { SCHEMAS } from '../../../schemas';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { UnidentifiedPill } from '../../../UnidentifiedPill';

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
                <h4 className="no-margin-top lineage-name-data">{header}</h4>
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

    const aliases = meta?.aliases;
    const description = meta?.description;
    const displayType = meta?.displayType;
    let identified: boolean;

    if (model && !model.isLoading && !model.hasLoadErrors) {
        // Drop the viewName from the schemaQuery so we can properly compare
        const sq = new SchemaQuery(model.schemaQuery.schemaName, model.schemaQuery.queryName);
        const isNucSeq = sq.isEqual(SCHEMAS.DATA_CLASSES.NUC_SEQUENCE);
        const isProtSeq = sq.isEqual(SCHEMAS.DATA_CLASSES.PROTEIN_SEQUENCE);
        const isMolSpecSeq = sq.isEqual(SCHEMAS.DATA_CLASSES.MOLECULAR_SPECIES_SEQ);

        if (isNucSeq || isProtSeq || isMolSpecSeq) {
            identified = caseInsensitive(model.getRow(), 'identified')?.value;
        }
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
            {displayType && <div>{displayType}</div>}
            {aliases && <div>{aliases.join(', ')}</div>}
            {description && <div title={description}>{description}</div>}
            {/* Triple eq is important here; we only want false, not falsey values */}
            {identified === false && <UnidentifiedPill />}
        </DetailHeader>
    );
});
NodeDetailHeader.displayName = 'NodeDetailHeader';
