import React, { Fragment, PureComponent, ReactNode } from 'react';
import { SVGIcon } from '../../..';

import { LineageNode } from '../models';
import { LineageNodeCollection } from '../vis/VisGraphGenerator';
import { getLineageNodeTitle } from '../utils';
import { NodeInteractionConsumer, WithNodeInteraction } from '../actions';

export interface DetailListLink extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
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
                        {headerLinks && headerLinks.map((link, i) => link && (
                            <Fragment key={i}>
                                &nbsp;
                                <a {...link} className="lineage-data-link--text show-on-hover">{link.text}</a>
                            </Fragment>
                        ))}
                    </h6>
                </summary>
                <ul style={{listStyleType: 'none', paddingLeft: '0', marginBottom: '0.5em'}}>
                    {React.Children.map(children, (child, i) => {
                        const showChild = expanded || i < collapsedCount;

                        if (i === collapsedCount) {
                            return (
                                <Fragment key="__skip">
                                    <li>
                                        <SVGIcon className="lineage-sm-icon" />
                                        &nbsp;
                                        <a className="lineage-link" onClick={this.toggle}>
                                            Show {React.Children.count(children) - collapsedCount} {expanded ? 'less' : 'more'}...
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


export class DetailsListGroup extends PureComponent {
    render() {
        return this.props.children;
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
            <>
                {node.steps.map((step, i) => (
                    <DetailsList
                        headerLinks={[{ text: 'Details', onClick: () => { onSelect(i); } }]}
                        key={`${node.lsid}.step.${i}`}
                        title={step.name}
                    >
                        <>
                            <SVGIcon className="lineage-sm-icon" />
                            {step.protocol.name}
                        </>
                    </DetailsList>
                ))}
            </>
        );
    }
}

interface DetailsListNodesProps {
    highlightNode?: string;
    listURL?: string;
    nodes: LineageNodeCollection;
    title: string;
}

export class DetailsListNodes extends PureComponent<DetailsListNodesProps> {

    renderNode = (node: LineageNode): ReactNode => {
        const { highlightNode } = this.props;

        const title = getLineageNodeTitle(node);

        const { iconURL, links, name } = node;

        return (
            <div
                className="lineage-name"
                key={node.lsid}
                style={{fontWeight: highlightNode === node.lsid ? 'bold' : 'normal'}}
                title={title}
            >
                <SVGIcon
                    className="lineage-sm-icon"
                    iconSrc={iconURL}
                />
                &nbsp;
                <NodeInteractionConsumer>
                    {(context: WithNodeInteraction) => {
                        if (context.isNodeInGraph(node)) {
                            return (
                                <a className="lineage-link"
                                   onClick={e => context.onNodeClick(node)}
                                   onMouseOver={e => context.onNodeMouseOver(node)}
                                   onMouseOut={e => context.onNodeMouseOut(node)}>{name}</a>
                            );
                        }

                        return <span>{name}</span>;
                    }}
                </NodeInteractionConsumer>
                &nbsp;
                <a href={links.overview}
                   className="show-on-hover lineage-data-link-left">
                    <span className="lineage-data-link--text">Overview</span>
                </a>
                {links.lineage !== undefined && (
                    <a href={links.lineage}
                       className="show-on-hover lineage-data-link-right">
                        <span className="lineage-data-link--text">Lineage</span>
                    </a>
                )}
            </div>
        );
    };

    render() {
        const { title, nodes } = this.props;

        return (
            <DetailsList
                headerLinks={[{
                    href: nodes.listURL,
                    text: 'View in grid',
                }]}
                title={title}
            >
                {nodes.nodes.map(this.renderNode)}
            </DetailsList>
        );
    }
}
