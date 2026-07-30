/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import { Tab, Tabs } from '../../../Tabs';
import { LineageSummary } from '../LineageSummary';
import {
    createLineageNodeCollections,
    isAliquotNode,
    LineageIOWithMetadata,
    LineageNode,
    LineageNodeCollection,
    LineageNodeCollectionByType,
} from '../models';
import { LineageOptions } from '../types';

import { Grid } from '../../base/Grid';
import { GridColumn } from '../../base/models/GridColumn';

import { hasModule } from '../../../app/utils';

import { LineageDetail } from './LineageDetail';
import { DetailHeader, NodeDetailHeader } from './NodeDetailHeader';
import { DetailsListLineageIO, DetailsListNodes, DetailsListSteps } from './DetailsList';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../../public/QueryModel/withQueryModels';
import { Filter } from '@labkey/api';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { QueryModel } from '../../../../public/QueryModel/QueryModel';

import { LINEAGE_DETAIL_REQUIRED_COLS } from '../constants';

interface LineageNodeDetailProps {
    highlightNode?: string;
    lineageOptions?: LineageOptions;
    node: LineageNode;
    seed: string;
}

const LineageNodeDetailImpl: FC<InjectedQueryModels & LineageNodeDetailProps> = memo(props => {
    const { seed, node, highlightNode, lineageOptions, queryModels } = props;
    const { containerPath, isRun, lsid, restricted } = node;
    const model = queryModels.model;
    const [stepIdx, setStepIdx] = useState<number>(undefined);
    const [tabKey, setTabKey] = useState<string>('details');
    const onBack = useCallback(() => setStepIdx(undefined), []);

    if (isRun && stepIdx !== undefined) {
        return <RunStepNodeDetail model={model} node={node} onBack={onBack} stepIdx={stepIdx} />;
    }

    const nodeDetails = (
        <>
            <LineageDetail item={node} model={model} />
            {!restricted && (
                <LineageSummary
                    {...lineageOptions}
                    containerPath={containerPath}
                    highlightNode={highlightNode}
                    key={lsid}
                    lsid={lsid}
                    prefetchSeed={false}
                />
            )}
        </>
    );

    return (
        <div className="lineage-node-detail">
            <NodeDetailHeader model={model} node={node} seed={seed} />
            {isRun && !restricted ? (
                <Tabs activeKey={tabKey} onSelect={setTabKey}>
                    <Tab eventKey="details" title="Details">
                        {nodeDetails}
                    </Tab>
                    <Tab eventKey="runProperties" title="Run Properties">
                        <DetailsListSteps node={node} onSelect={setStepIdx} />
                        <DetailsListLineageIO item={node} />
                    </Tab>
                </Tabs>
            ) : (
                nodeDetails
            )}
        </div>
    );
});
LineageNodeDetailImpl.displayName = 'LineageNodeDetailImpl';

const LineageNodeDetailWithModels = withQueryModels(LineageNodeDetailImpl);

export const LineageNodeDetail: FC<LineageNodeDetailProps> = memo(props => {
    const { highlightNode, lineageOptions, node, seed } = props;
    const queryConfigs = useMemo<QueryConfigMap>(() => {
        if (node.restricted) return {};

        return {
            model: {
                baseFilters: node.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)),
                containerPath: node.containerPath,
                // Issue 45028: Display details view columns in lineage
                schemaQuery: new SchemaQuery(node.schemaName, node.queryName).detailView,
                requiredColumns: LINEAGE_DETAIL_REQUIRED_COLS,
            },
        };
    }, [node]);

    return (
        <LineageNodeDetailWithModels
            autoLoad
            highlightNode={highlightNode}
            lineageOptions={lineageOptions}
            node={node}
            queryConfigs={queryConfigs}
            seed={seed}
        />
    );
});
LineageNodeDetail.displayName = 'LineageNodeDetail';

interface ClusterNodeDetailProps {
    highlightNode?: string;
    nodes: LineageNode[];
    nodesByType?: LineageNodeCollectionByType;
    options?: LineageOptions;
    parentNodeName?: string;
}

function getGroupDisplayName(nodeCollection: LineageNodeCollection, parentNodeName?: string): string {
    if (isAliquotNode(nodeCollection)) return (parentNodeName ? parentNodeName + ' ' : '') + 'Aliquots';
    return nodeCollection.displayType;
}

export const ClusterNodeDetail: FC<ClusterNodeDetailProps> = memo(props => {
    const { highlightNode, nodes, options, parentNodeName } = props;
    const { groups, nodesByType } = useMemo(() => {
        const nodesByType = props.nodesByType ?? createLineageNodeCollections(nodes, options);
        return { groups: Object.keys(nodesByType).sort(), nodesByType };
    }, [nodes, options, props.nodesByType]);

    let iconURL: string;
    let title: ReactNode;
    if (groups.length === 1) {
        title = nodes.length + ' ' + getGroupDisplayName(nodesByType[groups[0]]);
        iconURL = nodes[0].iconProps.iconURL;
    } else {
        title = nodes.length + ' items of different types';
        iconURL = 'default';
    }

    return (
        <div className="cluster-node-detail">
            <DetailHeader header={title} iconSrc={iconURL} />
            {groups.map(groupName => (
                <DetailsListNodes
                    highlightNode={highlightNode}
                    key={groupName}
                    nodes={nodesByType[groupName]}
                    title={getGroupDisplayName(nodesByType[groupName], parentNodeName)}
                />
            ))}
        </div>
    );
});
ClusterNodeDetail.displayName = 'ClusterNodeDetail';

interface RunStepNodeDetailProps {
    model: QueryModel;
    node: LineageNode;
    onBack: () => void;
    stepIdx: number;
}

const RunStepNodeDetail: FC<RunStepNodeDetailProps> = memo(props => {
    const { model, node, onBack, stepIdx } = props;
    const [tabKey, setTabKey] = useState<string>('details');
    const step = node.steps.get(stepIdx);
    const stepName = step.protocol?.name || step.name;
    const hasProvenanceModule = useMemo(() => hasModule('provenance'), []);

    return (
        <div className="run-step-node-detail">
            <DetailHeader header={`Run Step: ${stepName}`} iconSrc="default">
                <button className="lineage-link clickable-text" onClick={onBack} type="button">
                    <span>Back to Run Details</span>
                </button>
                <span className="spacer-left">&gt;</span>
                <span className="spacer-left">{stepName}</span>
            </DetailHeader>
            <Tabs activeKey={tabKey} onSelect={setTabKey}>
                <Tab eventKey="details" title="Step Details">
                    <LineageDetail item={step} model={model} />
                    <DetailsListLineageIO item={step} />
                </Tab>
                {hasProvenanceModule && (
                    <Tab className="lineage-run-step-provenance-map" eventKey="provenanceMap" title="Provenance Map">
                        <RunStepProvenanceMap item={step} />
                    </Tab>
                )}
            </Tabs>
        </div>
    );
});
RunStepNodeDetail.displayName = 'RunStepNodeDetail';

const provenanceCellRenderer = (data, row) => {
    const name = data?.get('name');
    const url = data?.get('url');
    if (url) {
        return <a href={url}>{name}</a>;
    }
    return name;
};

const PROVENANCE_MAP_COLS = List([
    new GridColumn({
        index: 'from',
        title: 'From',
        cell: provenanceCellRenderer,
    }),
    new GridColumn({
        index: 'to',
        title: 'To',
        cell: provenanceCellRenderer,
    }),
]);

export interface RunStepProvenanceMapProps {
    item: LineageIOWithMetadata;
}

const RunStepProvenanceMap: FC<RunStepProvenanceMapProps> = memo(({ item }) => {
    return <Grid columns={PROVENANCE_MAP_COLS} data={item?.provenanceMap ?? []} />;
});
RunStepProvenanceMap.displayName = 'RunStepProvenanceMap';
