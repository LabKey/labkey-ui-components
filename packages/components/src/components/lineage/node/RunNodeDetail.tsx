/*
 * Copyright (c) 2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';

import { LineageNode } from '../models';
import { NodeDetail } from './NodeDetail';
import { NodeDetailHeader } from './NodeDetailHeader';
import { getIconAndShapeForNode } from '../utils';

interface RunDetailProps {
    highlightNode?: string
    node: LineageNode
}

export const RunNodeDetail: React.FC<RunDetailProps> = (props) => {
    const [ stepIdx, setStepIdx ] = useState(undefined);
    const [ tabIdx, setTabIdx ] = useState(1);

    const { highlightNode, node } = props;

    if (!node.isRun) {
        throw new Error('RunNodeDetail can only display nodes of that are Runs.');
    }

    if (stepIdx) {
        return <RunStepNodeDetail node={node} stepIdx={stepIdx} />;
    }

    return (
        <>
            <NodeDetailHeader
                header="Some Run"
                iconSrc={getIconAndShapeForNode(node).iconURL}
            />
            <NodeDetail node={node} />

            <Tabs activeKey={tabIdx} defaultActiveKey={1} onSelect={t => setTabIdx(t)}>
                <Tab eventKey={2} title="Run properties">
                    <NodeDetail node={node} />
                </Tab>
                <Tab eventKey={1} title="Details">
                    <span>RunProperties</span>
                </Tab>
            </Tabs>
        </>
    );
};

export interface RunStepNodeDetailProps {
    node: LineageNode
    stepIdx: number
}

export class RunStepNodeDetail extends PureComponent<RunStepNodeDetailProps> {
    render() {
        return (
            <NodeDetailHeader header="Some Step" iconSrc="default" />
        )
    }
}
