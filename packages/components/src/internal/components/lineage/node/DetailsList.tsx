import React, { FC, Fragment, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { naturalSortByProperty } from '../../../../public/sort';
import {
    getLineageNodeTitle,
    LineageNodeCollection,
    LineageItemWithMetadata,
    LineageIOWithMetadata,
    LineageNode,
} from '../models';
import { DEFAULT_ICON_URL } from '../utils';
import { NodeInteractionConsumer } from '../actions';
import { LineageDataLink } from '../LineageDataLink';
import { SVGIcon } from '../../base/SVGIcon';

export interface DetailsListProps {
    collapsedCount?: number;
    headerLinks?: ReactNode[];
    open?: boolean;
    showCount?: boolean;
    title: string;
}

export const DetailsList: FC<DetailsListProps> = memo(props => {
    const { children, collapsedCount, headerLinks, open, showCount, title } = props;
    const [expanded, setExpanded] = useState<boolean>(false);

    const onToggle = useCallback(() => {
        setExpanded(ex => !ex);
    }, []);

    return (
        <details open={open}>
            <summary className="lineage-name">
                <h6 className="no-margin-bottom">
                    {title}
                    {showCount && <span className="spacer-left">({React.Children.count(children)})</span>}
                    {headerLinks &&
                        headerLinks.map(
                            (link, i) =>
                                link && (
                                    <span className="spacer-left" key={i}>
                                        {link}
                                    </span>
                                )
                        )}
                </h6>
            </summary>
            <ul className="lineage-details-list">
                {React.Children.map(children, (child, i) => {
                    const showChild = expanded || i < collapsedCount;

                    if (i === collapsedCount) {
                        return (
                            <Fragment key="__skip">
                                <li>
                                    <SVGIcon className="lineage-sm-icon" />
                                    <a className="lineage-link spacer-left" onClick={onToggle}>
                                        Show {React.Children.count(children) - collapsedCount}{' '}
                                        {expanded ? 'less' : 'more'}...
                                    </a>
                                </li>
                                {showChild ? <li key={i}>{child}</li> : null}
                            </Fragment>
                        );
                    }

                    return showChild ? <li key={i}>{child}</li> : null;
                })}
            </ul>
        </details>
    );
});

DetailsList.defaultProps = {
    collapsedCount: 4,
    open: true,
    showCount: true,
};

DetailsList.displayName = 'DetailsList';

interface DetailsListStepProps {
    node: LineageNode;
    onSelect: (stepIdx: number) => void;
}

export const DetailsListSteps: FC<DetailsListStepProps> = memo(({ node, onSelect }) => {
    if (!node.isRun) {
        return null;
    }

    return (
        <DetailsList title="Run steps">
            {node.steps.map((step, i) => (
                <div className="lineage-name" key={`${node.lsid}.step.${i}`}>
                    <SVGIcon className="lineage-sm-icon" iconSrc={step.iconProps?.iconURL ?? DEFAULT_ICON_URL} />
                    <span className="lineage-sm-name spacer-right">{step.protocol?.name || step.name}</span>
                    <LineageDataLink
                        onClick={() => {
                            onSelect(i);
                        }}
                    >
                        Details
                    </LineageDataLink>
                </div>
            ))}
        </DetailsList>
    );
});

DetailsListSteps.displayName = 'DetailsListSteps';

interface DetailsListLineageItemProps {
    highlighted: boolean;
    item: LineageItemWithMetadata;
}

const DetailsListLineageItem: FC<DetailsListLineageItemProps> = memo(({ highlighted, item }) => {
    const style = useMemo(
        () => ({
            fontWeight: highlighted ? 'bold' : 'normal',
        }),
        [highlighted]
    );

    return (
        <div className="lineage-item-test lineage-name" style={style} title={getLineageNodeTitle(item as LineageNode)}>
            <SVGIcon className="lineage-sm-icon" iconSrc={item.iconProps?.iconURL ?? DEFAULT_ICON_URL} />
            <NodeInteractionConsumer>
                {context => {
                    if (context.isNodeInGraph(item)) {
                        return (
                            <a
                                className="lineage-link spacer-horizontal"
                                onClick={e => context.onNodeClick(item)}
                                onMouseOver={e => context.onNodeMouseOver(item)}
                                onMouseOut={e => context.onNodeMouseOut(item)}
                            >
                                {item.name}
                            </a>
                        );
                    }

                    return <span className="spacer-horizontal">{item.name}</span>;
                }}
            </NodeInteractionConsumer>
            <LineageDataLink href={item.links.overview}>Overview</LineageDataLink>
            <LineageDataLink href={item.links.lineage}>Lineage</LineageDataLink>
        </div>
    );
});

DetailsListLineageItem.displayName = 'DetailsListLineageItem';

export interface DetailsListLineageItemsProps extends DetailsListProps {
    highlightNode?: string;
    items: LineageItemWithMetadata[];
}

export const DetailsListLineageItems: FC<DetailsListLineageItemsProps> = memo(props => {
    const { highlightNode, items, ...detailsListProps } = props;

    // Issue 48459: Sort lineage detail list items
    const sortedItems = useMemo<LineageItemWithMetadata[]>(() => {
        if (!items || items.length === 0) return [];
        return items.sort(naturalSortByProperty('name'));
    }, [items]);

    if (sortedItems.length === 0) {
        return null;
    }

    return (
        <DetailsList {...detailsListProps}>
            {items.map(item => (
                <DetailsListLineageItem highlighted={item.lsid === highlightNode} item={item} key={item.lsid} />
            ))}
        </DetailsList>
    );
});

DetailsListLineageItems.displayName = 'DetailsListLineageItems';

export interface DetailsListLineageIOProps {
    item: LineageIOWithMetadata;
}

export const DetailsListLineageIO: FC<DetailsListLineageIOProps> = memo(({ item }) => (
    <>
        <DetailsListLineageItems items={item.dataInputs} title="Data Inputs" />
        <DetailsListLineageItems items={item.materialInputs} title="Material Inputs" />
        <DetailsListLineageItems items={item.dataOutputs} title="Data Outputs" />
        <DetailsListLineageItems items={item.materialOutputs} title="Material Outputs" />
        <DetailsListLineageItems items={item.objectInputs} title="Object Inputs" />
        <DetailsListLineageItems items={item.objectOutputs} title="Object Outputs" />
    </>
));

DetailsListLineageIO.displayName = 'DetailsListLineageIO';

interface DetailsListNodesProps {
    highlightNode?: string;
    nodes: LineageNodeCollection;
    title: string;
}

export const DetailsListNodes: FC<DetailsListNodesProps> = memo(({ highlightNode, nodes, title }) => (
    <DetailsListLineageItems
        headerLinks={[
            <LineageDataLink key="grid" href={nodes.listURL}>
                View in grid
            </LineageDataLink>,
        ]}
        highlightNode={highlightNode}
        items={nodes.nodes}
        title={title}
    />
));

DetailsListNodes.displayName = 'DetailsListNodes';
