/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { Tab, Tabs } from 'react-bootstrap';

import {
    createLineageNodeCollections,
    isAliquotNodeCollection,
    LineageNodeCollectionByType
} from '../vis/VisGraphGenerator';
import { LineageSummary } from '../LineageSummary';
import { LineageNode } from '../models';
import { LineageOptions } from '../types';

import { LineageDetail } from './LineageDetail';
import { DetailHeader, NodeDetailHeader } from './NodeDetailHeader';
import { DetailsListLineageIO, DetailsListNodes, DetailsListSteps } from './DetailsList';

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

    componentDidUpdate(prevProps: Readonly<LineageNodeDetailProps>): void {
        const prevNode = prevProps.node;
        const { node } = this.props;

        if ((prevNode.isRun || node.isRun) && prevNode.lsid !== node.lsid) {
            this.setState(initialState);
        }
    }

    changeTab = (tabKey: number): void => {
        this.setState({ tabKey });
    };

    selectStep = (stepIdx: number): void => {
        this.setState({ stepIdx });
    };

    render(): ReactNode {
        const { seed, node, highlightNode, lineageOptions } = this.props;
        const { stepIdx, tabKey } = this.state;

        if (node.isRun && stepIdx !== undefined) {
            return <RunStepNodeDetail node={node} onBack={() => this.selectStep(undefined)} stepIdx={stepIdx} />;
        }

        const nodeDetails = (
            <>
                <LineageDetail item={node} />
                <LineageSummary
                    {...lineageOptions}
                    highlightNode={highlightNode}
                    key={node.lsid}
                    lsid={node.lsid}
                    prefetchSeed={false}
                    seedContainer={node.container}
                />
            </>
        );

        return (
            <div className="lineage-node-detail">
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
                            <DetailsListSteps node={node} onSelect={this.selectStep} />
                            <DetailsListLineageIO item={node} />
                        </Tab>
                    </Tabs>
                ) : (
                    nodeDetails
                )}
            </div>
        );
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string;
    nodes: LineageNode[];
    nodesByType?: LineageNodeCollectionByType;
    options?: LineageOptions;
    parentNodeName?: string;
}

export class ClusterNodeDetail extends PureComponent<ClusterNodeDetailProps> {

    static getGroupDisplayName (nodesByType, groupName, parentNodeName?) {
        const group = nodesByType[groupName];
        const isAliquot = isAliquotNodeCollection(group);
        const aliquotDisplayName = (parentNodeName ? parentNodeName + ' ' : '') + 'Aliquots';
        return isAliquot ? aliquotDisplayName : group.displayType;
    }

    render(): ReactNode {
        const { highlightNode, nodes, options, parentNodeName } = this.props;

        const nodesByType = this.props.nodesByType ?? createLineageNodeCollections(nodes, options);
        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + ClusterNodeDetail.getGroupDisplayName(nodesByType, groups[0]);
            iconURL = nodes[0].iconProps.iconURL;
        } else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <div className="cluster-node-detail">
                <DetailHeader header={title} iconSrc={iconURL} />
                {groups.map(groupName => {
                    const groupDisplayName = ClusterNodeDetail.getGroupDisplayName(nodesByType, groupName, parentNodeName);
                    return (
                    <DetailsListNodes
                        key={groupName}
                        title={groupDisplayName}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                    />)
                })}
            </div>
        );
    }
}

interface RunStepNodeDetailProps {
    node: LineageNode;
    onBack: () => void;
    stepIdx: number;
}

class RunStepNodeDetail extends PureComponent<RunStepNodeDetailProps> {
    render(): ReactNode {
        const { node, onBack, stepIdx } = this.props;
        const step = node.steps.get(stepIdx);

        return (
            <div className="run-step-node-detail">
                <DetailHeader header={`Run Step: ${step.name}`} iconSrc="default">
                    <a className="lineage-link" onClick={onBack}>
                        {node.name}
                    </a>
                    <span className="spacer-left">&gt;</span>
                    <span className="spacer-left">{step.name}</span>
                </DetailHeader>
                <LineageDetail item={step} />
                <DetailsListLineageIO item={step} />
            </div>
        );
    }
}
