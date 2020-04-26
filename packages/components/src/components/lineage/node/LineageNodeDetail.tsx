/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { Tab, Tabs } from 'react-bootstrap';

import { createLineageNodeCollections, LineageNodeCollectionByType } from '../vis/VisGraphGenerator';
import { LineageSummary } from '../LineageSummary';
import { LineageNode } from '../models';
import { LineageOptions } from '../types';

import { NodeDetail } from './NodeDetail';
import { DetailHeader, NodeDetailHeader } from './NodeDetailHeader';
import { DetailsListGroup, DetailsListNodes, DetailsListSteps } from './DetailsList';

interface LineageNodeDetailProps {
    highlightNode?: string;
    lineageOptions?: LineageOptions;
    node: LineageNode;
    seed: string;
}

interface LineageNodeDetailState {
    stepIdx: number;
    tabKey: number;
}

const initialState: LineageNodeDetailState = {
    stepIdx: undefined,
    tabKey: 1,
};

export class LineageNodeDetail extends PureComponent<LineageNodeDetailProps, LineageNodeDetailState> {
    readonly state: LineageNodeDetailState = initialState;

    changeTab = (tabKey: number) => {
        this.setState({ tabKey });
    };

    selectStep = (stepIdx: number): void => {
        this.setState({ stepIdx });
    };

    componentDidUpdate(prevProps: Readonly<LineageNodeDetailProps>): void {
        const prevNode = prevProps.node;
        const { node } = this.props;

        if (prevNode.isRun || node.isRun) {
            if (prevNode.lsid !== node.lsid) {
                this.setState(initialState);
            }
        }
    }

    render() {
        const { seed, node, highlightNode, lineageOptions } = this.props;
        const { stepIdx, tabKey } = this.state;

        if (node.isRun && stepIdx !== undefined) {
            return <RunStepNodeDetail node={node} onBack={() => this.selectStep(undefined)} stepIdx={stepIdx} />;
        }

        const nodeDetails = (
            <>
                <NodeDetail node={node} />
                <LineageSummary
                    {...lineageOptions}
                    highlightNode={highlightNode}
                    key={node.lsid}
                    lsid={node.lsid}
                    prefetchSeed={false}
                />
            </>
        );

        return (
            <>
                <NodeDetailHeader node={node} seed={seed} />
                {node.isRun ? (
                    <Tabs
                        activeKey={tabKey}
                        defaultActiveKey={1}
                        id="lineage-run-tabs"
                        onSelect={this.changeTab as any}
                    >
                        <Tab eventKey={1} title="Details">
                            {nodeDetails}
                        </Tab>
                        <Tab eventKey={2} title="Run Properties">
                            <DetailsListGroup>
                                <DetailsListSteps node={node} onSelect={this.selectStep} />
                            </DetailsListGroup>
                        </Tab>
                    </Tabs>
                ) : (
                    nodeDetails
                )}
            </>
        );
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string;
    nodes: LineageNode[];
    nodesByType?: LineageNodeCollectionByType;
    options?: LineageOptions;
}

export class ClusterNodeDetail extends PureComponent<ClusterNodeDetailProps> {
    render() {
        const { highlightNode, nodes, options } = this.props;

        const nodesByType = this.props.nodesByType ?? createLineageNodeCollections(nodes, options);
        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + groups[0];
            iconURL = nodes[0].iconURL;
        } else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <>
                <DetailHeader header={title} iconSrc={iconURL} />
                {groups.map(groupName => (
                    <DetailsListNodes
                        key={groupName}
                        title={groupName}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                    />
                ))}
            </>
        );
    }
}

interface RunStepNodeDetailProps {
    node: LineageNode;
    onBack: () => any;
    stepIdx: number;
}

class RunStepNodeDetail extends PureComponent<RunStepNodeDetailProps> {
    render() {
        const { node, onBack, stepIdx } = this.props;
        const step = node.steps.get(stepIdx);

        return (
            <>
                <DetailHeader header={`Run Step: ${step.name}`} iconSrc="default">
                    <a className="lineage-link" onClick={onBack}>
                        {node.name}
                    </a>
                    &nbsp;>&nbsp;<span>{step.name}</span>
                </DetailHeader>
                <NodeDetail node={step.protocol} />
            </>
        );
    }
}
