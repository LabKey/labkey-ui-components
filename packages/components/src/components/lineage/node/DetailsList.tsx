import React, { Fragment, PureComponent } from 'react';

import { SVGIcon } from '../../..';

import { LineageItemWithMetadata, LineageIOConfig, LineageNode } from '../models';
import { LineageNodeCollection } from '../vis/VisGraphGenerator';
import { getLineageNodeTitle } from '../utils';
import { NodeInteractionConsumer, WithNodeInteraction } from '../actions';

export interface DetailListLink
    extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    text: string;
}

export interface DetailsListProps {
    collapsedCount?: number;
    open?: boolean;
    headerLinks?: DetailListLink[];
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
        this.setState({ expanded: !this.state.expanded });
    };

    render() {
        const { children, collapsedCount, headerLinks, open, showCount, title } = this.props;
        const { expanded } = this.state;

        return (
            <details open={open}>
                <summary className="lineage-name">
                    <h6 className="no-margin-bottom">
                        {title}
                        {showCount && <span>&nbsp;({React.Children.count(children)})</span>}
                        {headerLinks &&
                            headerLinks.map(
                                (link, i) =>
                                    link && (
                                        <Fragment key={i}>
                                            &nbsp;
                                            <a {...link} className="lineage-data-link--text show-on-hover">
                                                {link.text}
                                            </a>
                                        </Fragment>
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
                                        &nbsp;
                                        <a className="lineage-link" onClick={this.toggle}>
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
    item: LineageIOConfig;
}

export class DetailsListLineageIO extends PureComponent<DetailsListLineageIOProps> {
    render() {
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
    render() {
        const { node, onSelect } = this.props;

        if (!node.isRun) {
            return null;
        }

        return (
            <DetailsList title="Run steps">
                {node.steps.map((step, i) => (
                    <div className="lineage-name" key={`${node.lsid}.step.${i}`}>
                        <SVGIcon className="lineage-sm-icon" iconSrc={step.iconProps.iconURL} />
                        <span>{step.name}</span>
                        &nbsp;
                        <a
                            className="show-on-hover lineage-data-link-left"
                            onClick={() => {
                                onSelect(i);
                            }}
                        >
                            <span className="lineage-data-link--text">Details</span>
                        </a>
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
    render() {
        const { highlightNode, nodes, title } = this.props;

        return (
            <DetailsListLineageItems
                headerLinks={[
                    {
                        href: nodes.listURL,
                        text: 'View in grid',
                    },
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
    render() {
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
                        &nbsp;
                        <NodeInteractionConsumer>
                            {(context: WithNodeInteraction) => {
                                if (context.isNodeInGraph(item)) {
                                    return (
                                        <a
                                            className="lineage-link"
                                            onClick={e => context.onNodeClick(item)}
                                            onMouseOver={e => context.onNodeMouseOver(item)}
                                            onMouseOut={e => context.onNodeMouseOut(item)}
                                        >
                                            {item.name}
                                        </a>
                                    );
                                }

                                return <span>{item.name}</span>;
                            }}
                        </NodeInteractionConsumer>
                        &nbsp;
                        <a href={item.links.overview} className="show-on-hover lineage-data-link-left">
                            <span className="lineage-data-link--text">Overview</span>
                        </a>
                        {item.links.lineage !== undefined && (
                            <a href={item.links.lineage} className="show-on-hover lineage-data-link-right">
                                <span className="lineage-data-link--text">Lineage</span>
                            </a>
                        )}
                    </div>
                ))}
            </DetailsList>
        );
    }
}
