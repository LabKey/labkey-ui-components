/*
 * Copyright (c) 2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';

import { LineageNode } from '../models';
import { NodeDetail } from './NodeDetail';
import { NodeDetailHeader } from './NodeDetailHeader';
import { getIconAndShapeForNode } from '../utils';

interface RunDetailProps {
    highlightNode?: string
    node: LineageNode
}

interface RunDetailState {
    selectedStepIndex: number
}

export class RunNodeDetail extends PureComponent<RunDetailProps> {

    readonly state: RunDetailState = { selectedStepIndex: undefined };

    selectStep = (selectedStepIndex: number): void => {
        this.setState({ selectedStepIndex });
    };

    render() {
        const { node } = this.props;
        const { selectedStepIndex } = this.state;

        if (!node.isRun) {
            throw new Error('RunNodeDetail can only display nodes of that are Runs.');
        }

        if (selectedStepIndex) {
            return (
                <RunStepNodeDetail
                    node={node}
                    stepIdx={selectedStepIndex}
                />
            );
        } else {
            return (
                <>
                    <NodeDetailHeader
                        header="Some Run"
                        iconSrc={getIconAndShapeForNode(node).iconURL}
                    />
                    <NodeDetail node={node} />
                </>
            )
        }
    }
}

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
