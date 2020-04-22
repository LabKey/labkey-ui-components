/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FunctionComponent, PureComponent, useState } from 'react';

import { createLineageNodeCollections, LineageNodeCollectionByType } from '../vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';
import { LineageSummary } from '../LineageSummary';
import { LineageNode } from '../models';
import { LineageOptions } from '../types';
import { NodeDetail } from './NodeDetail';
import { DetailHeader, NodeDetailHeader } from './NodeDetailHeader';

export interface SummaryOptions {
    summaryOptions?: LineageOptions
}

interface LineageNodeDetailProps {
    highlightNode?: string
    node: LineageNode
    seed: string
}

export const LineageNodeDetail: FunctionComponent<LineageNodeDetailProps & SummaryOptions> = (props) => {
    const [ stepIdx, setStepIdx ] = useState<number>(undefined);
    const { seed, node, highlightNode, summaryOptions } = props;

    if (node.isRun && stepIdx !== undefined) {
        return (
            <RunStepNodeDetail
                node={node}
                onBack={() => setStepIdx(undefined)}
                stepIdx={stepIdx}
            />
        );
    }

    return (
        <>
            <NodeDetailHeader node={node} seed={seed} />
            <NodeDetail node={node} />
            <LineageSummary highlightNode={highlightNode} options={summaryOptions} />
            {/*{node.isRun && node.steps.map((step, i) => (*/}
            {/*    <button key={i} onClick={() => { setStepIdx(i); }}>{step.name}</button>*/}
            {/*))}*/}
            {/*<DetailListGroup>*/}
            {/*    <DetailsList items={node.steps} onSelect={(s, i) => setStepIdx(i)} />*/}
            {/*    <DetailsList items={node.parents} itemType={DetailType.Parents} />*/}
            {/*    <DetailsList items={node.children} itemType={DetailType.Children} />*/}
            {/*</DetailListGroup>*/}
        </>
    );
};

interface ClusterNodeDetailProps {
    highlightNode?: string
    nodes: LineageNode[]
    nodesByType?: LineageNodeCollectionByType
    options?: LineageOptions
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
            iconURL = nodes[0].meta.iconURL;
        }
        else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <>
                <DetailHeader header={title} iconSrc={iconURL} />
                {groups.map(groupName =>
                    <LineageNodeList
                        key={groupName}
                        title={groupName}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                    />
                )}
            </>
        );
    }
}

interface RunStepNodeDetailProps {
    node: LineageNode
    onBack: () => any
    stepIdx: number
}

const RunStepNodeDetail: FunctionComponent<RunStepNodeDetailProps> = (props) => {
    const { node, onBack, stepIdx } = props;
    const step = node.steps.get(stepIdx);

    return (
        <>
            <DetailHeader
                header={`Step: ${step.name}`}
                iconSrc="default"
            >
                <a className="pointer" onClick={onBack}>{node.name}</a>&nbsp;>&nbsp;<span>{step.name}</span>
            </DetailHeader>
            <NodeDetail node={step.protocol} />
        </>
    );
};
