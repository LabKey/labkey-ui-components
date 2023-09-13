/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext } from 'react';
import { Draft, produce } from 'immer';
import { fromJS, Map, OrderedSet } from 'immutable';
import { Experiment, Filter, getServerContext, Query } from '@labkey/api';

import { SAMPLES_KEY } from '../../app/constants';

import { ISelectRowsResult, selectRowsDeprecated } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';
import { AppURL } from '../../url/AppURL';
import { naturalSort } from '../../../public/sort';
import { Location } from '../../util/URL';

import { ViewInfo } from '../../ViewInfo';

import { getURLResolver, LineageURLResolver } from './LineageURLResolvers';
import { getLineageDepthFirstNodeList, resolveIconAndShapeForNode } from './utils';
import { LINEAGE_DIRECTIONS, LineageFilter, LineageLinkMetadata, LineageOptions } from './types';
import { DEFAULT_LINEAGE_DIRECTION, DEFAULT_LINEAGE_DISTANCE } from './constants';
import {
    Lineage,
    LineageGridModel,
    LineageIOWithMetadata,
    LineageItemWithIOMetadata,
    LineageItemWithMetadata,
    LineageNode,
    LineageNodeMetadata,
    LineageResult,
    LineageRunStep,
} from './models';

const LINEAGE_METADATA_COLUMNS = OrderedSet<string>(['LSID', 'Name', 'Description', 'Alias', 'RowId', 'Created']);

export interface WithNodeInteraction {
    isNodeInGraph?: (node: Experiment.LineageItemBase) => boolean;
    onNodeClick?: (node: Experiment.LineageItemBase) => void;
    onNodeMouseOut?: (node: Experiment.LineageItemBase) => void;
    onNodeMouseOver?: (node: Experiment.LineageItemBase) => void;
}

const NodeInteractionContext = createContext<WithNodeInteraction>(undefined);
export const NodeInteractionProvider = NodeInteractionContext.Provider;
export const NodeInteractionConsumer = NodeInteractionContext.Consumer;

function fetchLineageNodes(lsids: string[], containerPath?: string): Promise<LineageNode[]> {
    return new Promise((resolve, reject) => {
        return Experiment.resolve({
            containerPath,
            lsids,
            success: json => {
                resolve(json.data.map(n => LineageNode.create(n.lsid, n as any)));
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

function applyLineageMetadata(
    lineage: LineageResult,
    metadata: Record<string /* LSID */, LineageNodeMetadata>,
    iconURLByLsid: Record<string /* LSID */, string>,
    options?: LineageOptions
): LineageResult {
    const urlResolver = getURLResolver(options);

    const nodes = lineage.nodes.map(node => {
        const config = {
            ...applyItemMetadata(node, iconURLByLsid, urlResolver, lineage.seed === node.lsid),
            steps: node.steps.map(
                produce((draft: Draft<LineageRunStep>) => {
                    Object.assign(draft, applyItemMetadata(draft, iconURLByLsid, urlResolver));
                })
            ),
            meta: metadata[node.lsid],
        };

        // Unfortunately, Immutable.merge converts all types to Immutable types (e.g. {} -> Map) which
        // is not acceptable. Doing a manual merge...
        Object.keys(config).forEach(prop => {
            node = node.set(prop, config[prop]) as LineageNode;
        });

        return node;
    });

    return lineage.set('nodes', nodes) as LineageResult;
}

function applyItemMetadata(
    item: LineageItemWithIOMetadata,
    iconURLByLsid: Record<string /* LSID */, string>,
    urlResolver: LineageURLResolver,
    isSeed = false
): Partial<LineageItemWithIOMetadata> {
    return {
        ...applyLineageIOMetadata(item, iconURLByLsid, urlResolver),
        iconProps: resolveIconAndShapeForNode(item, iconURLByLsid[item.lsid], isSeed),
        links: urlResolver.resolveItem(item) ?? ({} as LineageLinkMetadata),
    };
}

function applyLineageIOMetadata(
    item: LineageIOWithMetadata,
    iconURLByLsid: Record<string /* LSID */, string>,
    urlResolver: LineageURLResolver
): LineageIOWithMetadata {
    const _applyItem = produce((draft: Draft<LineageItemWithMetadata>) => {
        draft.iconProps = resolveIconAndShapeForNode(draft, iconURLByLsid[draft.lsid]);
        draft.links = urlResolver.resolveItem(draft);
    });

    return {
        dataInputs: item.dataInputs.map(_applyItem),
        dataOutputs: item.dataOutputs.map(_applyItem),
        materialInputs: item.materialInputs.map(_applyItem),
        materialOutputs: item.materialOutputs.map(_applyItem),
        objectInputs: item.objectInputs.map(_applyItem),
        objectOutputs: item.objectOutputs.map(_applyItem),
    };
}

// TODO add jest test coverage for this function
function computeSampleCounts(lineageResult: LineageResult, sampleSets: ISelectRowsResult): any {
    const { key, models } = sampleSets;
    const { nodes, seed } = lineageResult;

    const nodeIds = {};
    const seedNode = nodes.get(seed);

    nodes.forEach(({ cpasType, id, lsid }) => {
        if (lsid && cpasType) {
            if (!nodeIds[cpasType]) {
                nodeIds[cpasType] = [];
            }

            nodeIds[cpasType].push(id);
        }
    });

    const rows = Object.values(models[key]).map(row => {
        const name = caseInsensitive(row, 'Name').value;
        const cpasType = caseInsensitive(row, 'LSID').value;
        const count = nodeIds[cpasType]?.length ?? 0;

        return {
            name: {
                url: AppURL.create(SAMPLES_KEY, name).toHref(),
                value: name,
            },
            sampleCount: {
                url:
                    count > 0
                        ? AppURL.create('rd', 'expdata', seedNode.id, 'samples').addParam('tab', name).toHref()
                        : undefined,
                value: count,
            },
            modified: count > 0 ? caseInsensitive(row, 'Modified') : undefined,
        };
    });

    rows.sort((rowA, rowB) => naturalSort(rowA.name.value, rowB.name.value));

    return fromJS(rows);
}

export function createGridModel(
    lineage: Lineage,
    members: LINEAGE_DIRECTIONS,
    distance: number,
    pageNumber: number
): LineageGridModel {
    const result = lineage.filterResult({
        filters: [new LineageFilter('type', ['Sample', 'Data'])],
    });

    distance = distance ?? DEFAULT_LINEAGE_DISTANCE;
    members = members ?? DEFAULT_LINEAGE_DIRECTION;
    pageNumber = pageNumber ?? 1;

    const data = getLineageDepthFirstNodeList(result.nodes, result.seed, members, distance);
    const nodeCounts = data.reduce((map, node) => {
        const { lsid } = node;
        if (map.has(lsid)) {
            return map.set(lsid, map.get(lsid) + 1);
        }
        return map.set(lsid, 1);
    }, Map<string, number>());

    return new LineageGridModel({
        data,
        distance,
        isError: false,
        isLoaded: true,
        isLoading: false,
        members,
        message: undefined,
        nodeCounts,
        pageNumber,
        seedNode: data.get(0),
        totalRows: data.size,
    });
}

export function getPageNumberChangeURL(location: Location, seed: string, pageNumber: number): AppURL {
    let url = AppURL.create('lineage');

    // use the seed lsid value from the param
    url = url.addParam('seeds', seed);

    location.query.map((value: any, key: string) => {
        if (key !== 'p' && key !== 'seeds') {
            url = url.addParam(key, value);
        }
    });

    if (pageNumber > 1) {
        url = url.addParam('p', pageNumber);
    }

    return url;
}

export function getLineageFilterValue(lsid: string, depth: number | string): string {
    const filterVals = [lsid, depth];
    return '{json:' + JSON.stringify(filterVals) + '}';
}

export function getImmediateChildLineageFilterValue(lsid: string): string {
    return getLineageFilterValue(lsid, 1);
}

export interface LineageAPIWrapper {
    loadLineageResult: (
        seed: string,
        container?: string,
        distance?: number,
        options?: LineageOptions
    ) => Promise<LineageResult>;
    loadNodeMetadata: (lineage: LineageResult) => Array<Promise<ISelectRowsResult>>;
    loadSampleStats: (lineageResult: LineageResult) => Promise<any>;
    loadSeedResult: (seed: string, container?: string, options?: LineageOptions) => Promise<LineageResult>;
}

let lineageResultCache: Record<string, Promise<LineageResult>> = {};
let lineageSeedCache: Record<string, Promise<LineageResult>> = {};

export function invalidateLineageResults(): void {
    lineageResultCache = {};
    lineageSeedCache = {};
}

export class ServerLineageAPIWrapper implements LineageAPIWrapper {
    processLineageResult = async (lineage: LineageResult, options?: LineageOptions): Promise<LineageResult> => {
        const iconURLByLsid = {};
        const metadata = {};
        const results = await Promise.all(this.loadNodeMetadata(lineage));

        results.forEach(result => {
            const queryInfo = result.queries[result.key];
            const model = fromJS(result.models[result.key]);
            model.forEach(data => {
                const lsid = data.getIn(['LSID', 'value']);
                iconURLByLsid[lsid] = queryInfo.iconURL;
                metadata[lsid] = LineageNodeMetadata.create(data, queryInfo);
            });
        });

        return applyLineageMetadata(lineage, metadata, iconURLByLsid, options);
    };

    loadLineage = (options: Omit<Experiment.LineageOptions, 'lsids'>): Promise<LineageResult> => {
        return new Promise((resolve, reject) => {
            const seed = options.lsid;

            Experiment.lineage({
                ...options,
                success: lineage => {
                    resolve(LineageResult.create(lineage));
                },
                failure: error => {
                    let message = `Failed to fetch lineage for seed "${seed}".`;

                    if (error) {
                        if (error.exception) {
                            message = error.exception;

                            // When a server exception occurs
                            if (error.exceptionClass) {
                                message = `${error.exceptionClass}: ` + error.exception;
                            }
                        }
                    }

                    reject({
                        seed,
                        message,
                    });
                },
            });
        });
    };

    loadLineageResult = (
        seed: string,
        container?: string,
        distance?: number,
        options?: LineageOptions
    ): Promise<LineageResult> => {
        const fetchOptions: Experiment.LineageOptions = {
            ...options?.request,
            lsid: seed,
            runProtocolLsid: options?.runProtocolLsid,
        };

        const currentContainerId = getServerContext().container.id;

        if (!container) {
            container = currentContainerId;
        }

        // Lineage API currently responds with the container's entity ID.
        // Only apply container if it doesn't match the current container.
        if (container !== currentContainerId) {
            fetchOptions.containerPath = container;
        }

        if (!isNaN(distance)) {
            // The lineage includes a "run" object for each parent as well, so we
            // query for twice the depth requested in the URL.
            fetchOptions.depth = distance * 2;
        }

        const key = [
            seed,
            container ?? '',
            distance ?? -1,
            fetchOptions.includeInputsAndOutputs === true,
            fetchOptions.includeRunSteps === true,
            fetchOptions.includeProperties === true,
            options?.runProtocolLsid ?? '',
        ].join('|');

        if (!lineageResultCache[key]) {
            lineageResultCache[key] = this.loadLineage(fetchOptions).then(r => this.processLineageResult(r, options));
        }

        return lineageResultCache[key];
    };

    loadNodeMetadata = (lineage: LineageResult): Array<Promise<ISelectRowsResult>> => {
        // Node metadata does not support nodes with multiple primary keys. These could be supported, however,
        // each node would require it's own request for the unique keys combination. Also, nodes without any primary
        // keys cannot be filtered upon and thus are also not supported.
        return lineage.nodes
            .filter(n => n.schemaName !== undefined && n.queryName !== undefined && n.pkFilters.length === 1)
            .groupBy(n => [n.schemaName, n.queryName].join('|||').toLowerCase())
            .map(nodes => {
                const node = nodes.first();
                const { fieldKey } = node.pkFilters[0];

                return selectRowsDeprecated({
                    containerPath: node.containerPath,
                    schemaName: node.schemaName,
                    queryName: node.queryName,
                    viewName: ViewInfo.DETAIL_NAME, // use Detail view to assure we get all data, even when default view is filtered
                    // TODO: Is there a better way to determine set of columns? Can we follow convention for detail views?
                    // See LineageNodeMetadata (and it's usages) for why this is currently necessary
                    columns: LINEAGE_METADATA_COLUMNS.add(fieldKey).join(','),
                    filterArray: [Filter.create(fieldKey, nodes.map(n => n.pkFilters[0].value).toArray(), Filter.Types.IN)],
                });
            })
            .toArray();
    };

    loadSampleStats = (lineageResult: LineageResult): Promise<any> => {
        return selectRowsDeprecated({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        }).then(sampleSets => computeSampleCounts(lineageResult, sampleSets));
    };

    loadSeedResult = (seed: string, container?: string, options?: LineageOptions): Promise<LineageResult> => {
        const key = [seed, container ?? ''].join('|');

        if (!lineageSeedCache[key]) {
            lineageSeedCache[key] = fetchLineageNodes([seed], container)
                .then(nodes => nodes[0])
                .then(seedNode =>
                    LineageResult.create({
                        nodes: { [seedNode.lsid]: seedNode },
                        seed: seedNode.lsid,
                    })
                )
                .then(result => this.processLineageResult(result, options));
        }

        return lineageSeedCache[key];
    };
}

export class TestLineageAPIWrapper extends ServerLineageAPIWrapper {
    result: LineageResult;
    metadata: ISelectRowsResult[];
    constructor(result, metadata) {
        super();
        this.result = result;
        this.metadata = metadata;
    }
    loadNodeMetadata = (lineage: LineageResult): Array<Promise<ISelectRowsResult>> => {
        return this.metadata.map(m => Promise.resolve(m));
    };

    loadLineage = (options: Omit<Experiment.LineageOptions, 'lsids'>): Promise<LineageResult> => {
        return Promise.resolve(this.result);
    };
}
