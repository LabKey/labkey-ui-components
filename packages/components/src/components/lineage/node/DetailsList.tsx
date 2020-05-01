import React, { Fragment, PureComponent, ReactNode } from 'react';

import { SVGIcon } from '../../..';

import { LineageItemWithMetadata, LineageIOWithMetadata, LineageNode } from '../models';
import { LineageNodeCollection } from '../vis/VisGraphGenerator';
import { getLineageNodeTitle } from '../utils';
import { NodeInteractionConsumer, WithNodeInteraction } from '../actions';
import { LineageDataLink } from '../LineageDataLink';

export interface DetailsListProps {
    collapsedCount?: number;
    open?: boolean;
    headerLinks?: ReactNode[];
    title: string;
    showCount?: boolean;
}

interface DetailsListState {
    expanded: boolean;
}

export class DetailsList extends PureComponent<DetailsListProps, DetailsListState> {
    static defaultProps = {
        collapsedCount: 4,
        open: true,
        showCount: true,
    };

    readonly state: DetailsListState = { expanded: false };

    toggle = (): void => {
        this.setState(state => ({ expanded: !state.expanded }));
    };

    render(): ReactNode {
        const { children, collapsedCount, headerLinks, open, showCount, title } = this.props;
        const { expanded } = this.state;

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
                                        <a className="lineage-link spacer-left" onClick={this.toggle}>
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
    }
}

export interface DetailsListLineageIOProps {
    item: LineageIOWithMetadata;
}

export class DetailsListLineageIO extends PureComponent<DetailsListLineageIOProps> {
    render(): ReactNode {
        const { item } = this.props;

        return (
            <>
                <DetailsListLineageItems items={item.dataInputs} title="Data Inputs" />
                <DetailsListLineageItems items={item.materialInputs} title="Material Inputs" />
                <DetailsListLineageItems items={item.dataOutputs} title="Data Outputs" />
                <DetailsListLineageItems items={item.materialOutputs} title="Material Outputs" />
            </>
        );
    }
}

interface DetailsListStepProps {
    node: LineageNode;
    onSelect: (stepIdx: number) => any;
}

export class DetailsListSteps extends PureComponent<DetailsListStepProps> {
    render(): ReactNode {
        const { node, onSelect } = this.props;

        if (!node.isRun) {
            return null;
        }

        return (
            <DetailsList title="Run steps">
                {node.steps.map((step, i) => (
                    <div className="lineage-name" key={`${node.lsid}.step.${i}`}>
                        <SVGIcon className="lineage-sm-icon" iconSrc={step.iconProps.iconURL} />
                        <span className="spacer-right">{step.name}</span>
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
    }
}

interface DetailsListNodesProps {
    highlightNode?: string;
    nodes: LineageNodeCollection;
    title: string;
}

export class DetailsListNodes extends PureComponent<DetailsListNodesProps> {
    render(): ReactNode {
        const { highlightNode, nodes, title } = this.props;

        return (
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
        );
    }
}

export interface DetailsListLineageItemsProps extends DetailsListProps {
    highlightNode?: string;
    items: LineageItemWithMetadata[];
}

export class DetailsListLineageItems extends PureComponent<DetailsListLineageItemsProps> {
    render(): ReactNode {
        const { highlightNode, items } = this.props;

        if (!items || items.length === 0) {
            return null;
        }

        return (
            <DetailsList {...this.props}>
                {items.map(item => (
                    <div
                        className="lineage-item-test lineage-name"
                        key={item.lsid}
                        style={{ fontWeight: highlightNode === item.lsid ? 'bold' : 'normal' }}
                        title={getLineageNodeTitle(item as LineageNode)}
                    >
                        <SVGIcon className="lineage-sm-icon" iconSrc={item.iconProps.iconURL} />
                        <NodeInteractionConsumer>
                            {(context: WithNodeInteraction) => {
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
                ))}
            </DetailsList>
        );
    }
}
