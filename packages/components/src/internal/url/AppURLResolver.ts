/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List, Map } from 'immutable';
import { Filter } from '@labkey/api';

import { SAMPLE_MANAGEMENT, SCHEMAS } from '../schemas';

import { AppURL, spliceURL } from './AppURL';
import { fetchProtocol } from '../components/domainproperties/assay/actions';
import { AssayProtocolModel } from '../components/domainproperties/assay/models';
import { selectRows } from '../query/selectRows';
import { caseInsensitive } from '../util/utils';
import { getQueryDetails } from '../query/api';
import { AppRouteResolver } from './models';
import { decodeListResolverPath } from './utils';

/**
 * Resolves Data Class routes dynamically
 * /assays/44/... -> /assays/providerName/assayName/...
 */
export class AssayResolver implements AppRouteResolver {
    datas: Map<number, { name: string; provider: string }>; // Map<AssayProtocolId, {name, provider}>

    constructor(datas?: Map<number, { name: string; provider: string }>) {
        this.datas = datas !== undefined ? datas : Map<number, { name: string; provider: string }>();
    }

    matches(route: string): boolean {
        return /\/assays\/(\d+$|\d+\/)/.test(route);
    }

    fetch(parts: any[]): Promise<AppURL | boolean> {
        const assayRowIdIndex = 1;
        const assayRowId: number = parseInt(parts[assayRowIdIndex], 10);

        if (isNaN(assayRowId)) {
            return Promise.resolve(true);
        } else if (this.datas.has(assayRowId)) {
            const context = this.datas.get(assayRowId);
            const newParts = [context.provider, context.name];
            return Promise.resolve(spliceURL(parts, newParts, assayRowIdIndex));
        } else {
            return new Promise(resolve => {
                return fetchProtocol(assayRowId)
                    .then((assay: AssayProtocolModel) => {
                        const context = {
                            name: encodeURIComponent(assay.name),
                            provider: assay.providerName,
                        };

                        this.datas = this.datas.set(assayRowId, context);
                        const newParts = [context.provider, context.name];
                        return resolve(spliceURL(parts, newParts, assayRowIdIndex));
                    })
                    .catch(() => {
                        return resolve(true);
                    });
            });
        }
    }
}

/**
 * Resolves Assay Run routes dynamically
 * /rd/assayrun/543/... -> /assays/44/runs/584/...
 */
export class AssayRunResolver implements AppRouteResolver {
    datas: Map<number, number>;

    constructor(datas?: Map<number, number>) {
        this.datas = datas !== undefined ? datas : Map<number, number>();
    }

    matches(route: string): boolean {
        return /\/rd\/assayrun\/(\d+$|\d+\/)/.test(route);
    }

    async fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["rd", "assayrun", "543", ...]
        const assayRunIdIndex = 2;
        const assayRunId: number = parseInt(parts[assayRunIdIndex], 10);

        if (isNaN(assayRunId)) {
            // skip it
            return true;
        } else if (this.datas.has(assayRunId)) {
            // resolve it
            const newParts = ['assays', this.datas.get(assayRunId), 'runs'];
            return spliceURL(parts, newParts, 0, assayRunIdIndex);
        }

        // fetch it
        try {
            const result = await selectRows({
                columns: 'RowId,Protocol/RowId',
                filterArray: [Filter.create('RowId', assayRunId)],
                schemaQuery: SCHEMAS.EXP_TABLES.ASSAY_RUNS,
            });

            if (result.rows.length === 1) {
                const assayProtocolId = caseInsensitive(result.rows[0], 'Protocol/RowId').value;

                // cache
                this.datas.set(assayRunId, assayProtocolId);

                // resolve it
                const newParts = ['assays', assayProtocolId, 'runs'];
                return spliceURL(parts, newParts, 0, assayRunIdIndex);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return true;
    }
}

/**
 * Resolves list routes dynamically
 * /q/lists/$CPS<container_path>$CPE/22/14/... -> /q/lists/listByName/14/...
 */
export class ListResolver implements AppRouteResolver {
    fetched: boolean;
    lists: Map<string, string>; // Map<containerPath|listId, listName>

    constructor(lists?: Map<string, string>) {
        this.fetched = false;
        this.lists = lists !== undefined ? lists : Map<string, string>();
    }

    matches(route: string): boolean {
        return /\/q\/lists\/(\$CPS.+\$CPE)\/(\d+$|\d+)\/*/.test(decodeURIComponent(route));
    }

    async fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["q", "lists", "/container/path", "44", ...]
        const containerPathIndex = 2;
        const listIdIndex = 3;
        const listIdNum = parseInt(parts[listIdIndex], 10);
        const containerPath = decodeListResolverPath(
            decodeURIComponent(parts[containerPathIndex])
        )?.toLowerCase();
        const key = [containerPath, listIdNum].join('|');

        if (isNaN(listIdNum) || !containerPath) {
            // skip it
            return true;
        } else if (this.lists.has(key)) {
            // resolve it
            const newParts = [this.lists.get(key)];
            return spliceURL(parts, newParts, containerPathIndex, 2);
        } else if (this.fetched) {
            // skip it
            return true;
        }

        // fetch it
        try {
            const result = await selectRows({
                schemaQuery: SCHEMAS.LIST_METADATA_TABLES.LIST_MANAGER,
                columns: 'ListId,Name,Container/Path',
            });

            this.fetched = true;

            // fulfill local cache
            this.lists = result.rows
                .reduce<Map<string, string>>((map, list) => {
                    const _containerPath = caseInsensitive(list, 'Container/Path').value.toLowerCase();
                    const _listId = caseInsensitive(list, 'ListId').value;
                    const _name = caseInsensitive(list, 'Name').value.toLowerCase();

                    const _key = [_containerPath, _listId].join('|');
                    return map.set(_key, _name);
                }, Map<string, string>().asMutable())
                .asImmutable();

            // respond
            if (this.lists.has(key)) {
                // resolve it
                const newParts = [this.lists.get(key)];
                return spliceURL(parts, newParts, containerPathIndex, 2);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return true;
    }
}

/**
 * Resolves sample routes dynamically
 * /rd/samples/14/... -> /samples/sampleSetByName/14/... || /media/batches/14
 */
export class SamplesResolver implements AppRouteResolver {
    samples: Map<number, List<string>>; // Map<SampleRowId, List<'samples' | 'media', sampleSetName | 'batches'>>

    constructor(samples?: Map<number, List<string>>) {
        this.samples = samples !== undefined ? samples : Map<number, List<string>>();
    }

    matches(route: string): boolean {
        return /\/rd\/samples\/(\d+$|\d+\/)/.test(route);
    }

    async fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["rd", "samples", "118", ...]
        const sampleRowIdIndex = 2;
        const sampleRowId: number = parseInt(parts[sampleRowIdIndex], 10);

        if (isNaN(sampleRowId)) {
            // skip it
            return true;
        } else if (this.samples.has(sampleRowId)) {
            // resolve it
            const newParts = this.samples.get(sampleRowId).toArray();
            return spliceURL(parts, newParts, 0, 2);
        }

        // fetch it
        try {
            const result = await selectRows({
                schemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
                columns: 'RowId,SampleSet',
                filterArray: [Filter.create('RowId', sampleRowId)],
            });

            if (result.rows.length === 1) {
                const sampleTypeName = caseInsensitive(result.rows[0], 'SampleSet').displayValue.toLowerCase();

                const info = await getQueryDetails({
                    schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
                    queryName: sampleTypeName,
                });

                // fulfill cache
                let value: List<string>;
                if (info?.isMedia) {
                    // for supporting MIXTURE_BATCHES => mixturebatches
                    const mediaTypeName =
                        info.name.toLowerCase() === SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase()
                            ? 'mixturebatches'
                            : info.name;
                    value = List(['media', encodeURIComponent(mediaTypeName)]);
                } else {
                    value = List([SCHEMAS.SAMPLE_SETS.SCHEMA.toLowerCase(), encodeURIComponent(sampleTypeName)]);
                }

                this.samples = this.samples.set(sampleRowId, value);

                if (this.samples.has(sampleRowId)) {
                    // resolve it
                    const newParts = this.samples.get(sampleRowId).toArray();
                    return spliceURL(parts, newParts, 0, 2);
                }
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return true;
    }
}

/**
 * Resolves experiment runs to workflow jobs if appropriate
 * /rd/run/14/... -> /workflow/14/...
 * If this doesn't correspond to a job, the link won't resolve.
 *
 * Ideally we would resolve to the original URL if it's not a job, but since that's a link out to LKS
 * it's not current supported by AppRouteResolvers.  Alternatively, and perhaps more ideally, we'd resolve
 * to the lineage page for a sample, but the URL here doesn't have any info about the related entity.
 */
export class ExperimentRunResolver implements AppRouteResolver {
    jobs: Set<number>; // set of rowIds that are jobs

    static createURL(rowId: string | number): AppURL {
        return AppURL.create('rd', 'run', rowId);
    }

    constructor(jobs?: Set<number>) {
        this.jobs = jobs !== undefined ? jobs : new Set();
    }

    async fetch(parts: any[]): Promise<AppURL | boolean> {
        const rowIdIndex = 2;
        const rowId = parseInt(parts[rowIdIndex], 10);

        if (isNaN(rowId)) {
            // skip it
            return true;
        }
        if (this.jobs.has(rowId)) {
            // resolve it
            return AppURL.create('workflow', rowId);
        }
        try {
            const result = await selectRows({
                schemaQuery: SAMPLE_MANAGEMENT.JOBS,
                filterArray: [Filter.create('RowId', rowId)],
                columns: 'RowId',
            });

            if (result.rows.length > 0) {
                // resolve it
                this.jobs.add(rowId);
                return AppURL.create('workflow', rowId);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return true;
    }

    matches(route: string): boolean {
        return /\/rd\/run\/\d+$/.test(route);
    }
}
