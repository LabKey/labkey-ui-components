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

import { AssayProtocolModel, fetchProtocol, getQueryDetails, SCHEMAS, selectRows } from '../..';

import { AppURL, spliceURL } from './AppURL';

export interface AppRouteResolver {
    matches: (route: string) => boolean;
    fetch: (parts: any[]) => Promise<AppURL | boolean>;
}

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

    fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["rd", "assayrun", "543", ...]
        const assayRunIdIndex = 2;
        const assayRunId: number = parseInt(parts[assayRunIdIndex], 10);

        if (isNaN(assayRunId)) {
            return Promise.resolve(true);
        } else if (this.datas.has(assayRunId)) {
            const newParts = ['assays', this.datas.get(assayRunId), 'runs'];
            return Promise.resolve(spliceURL(parts, newParts, 0, assayRunIdIndex));
        } else {
            return new Promise(resolve => {
                return selectRows({
                    schemaName: SCHEMAS.EXP_TABLES.ASSAY_RUNS.schemaName,
                    queryName: SCHEMAS.EXP_TABLES.ASSAY_RUNS.queryName,
                    columns: 'RowId,Protocol/RowId',
                    filterArray: [Filter.create('RowId', assayRunId)],
                })
                    .then(result => {
                        const entries = result.orderedModels[result.key];

                        if (entries.size === 1) {
                            const data = result.models[result.key][entries.first()];
                            const assayProtocolId = data['Protocol/RowId']['value'];

                            // cache
                            this.datas.set(assayRunId, assayProtocolId);

                            const newParts = ['assays', assayProtocolId, 'runs'];
                            return resolve(spliceURL(parts, newParts, 0, assayRunIdIndex));
                        }

                        // skip it
                        resolve(true);
                    })
                    .catch(() => {
                        // skip it
                        resolve(true);
                    });
            });
        }
    }
}

/**
 * Resolves list routes dynamically
 * /q/lists/22/14/... -> /q/lists/listByName/14/...
 */
export class ListResolver implements AppRouteResolver {
    fetched: boolean;
    lists: Map<number, string>; // Map<listId, listName>

    constructor(lists?: Map<number, string>) {
        this.fetched = false;
        this.lists = lists !== undefined ? lists : Map<number, string>();
    }

    matches(route: string): boolean {
        return /\/q\/lists\/(\d+$|\d+\/)/.test(route);
    }

    fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["q", "lists", "44", ...]
        const listIdIndex = 2;
        const listIdNum: number = parseInt(parts[listIdIndex], 10);

        if (isNaN(listIdNum)) {
            // skip it
            return Promise.resolve(true);
        } else if (this.lists.has(listIdNum)) {
            // resolve it
            const newParts = [this.lists.get(listIdNum)];
            return Promise.resolve(spliceURL(parts, newParts, listIdIndex));
        } else if (this.fetched) {
            // skip it
            return Promise.resolve(true);
        } else {
            // fetch it
            return new Promise(resolve => {
                return selectRows({
                    schemaName: SCHEMAS.LIST_METADATA_TABLES.SCHEMA,
                    queryName: SCHEMAS.LIST_METADATA_TABLES.LIST_MANAGER.queryName,
                    columns: 'ListId,Name',
                }).then(result => {
                    this.fetched = true;

                    // fulfill local cache
                    const allLists = Map<number, string>().asMutable();
                    const lists = result.models[result.key];
                    for (var i in lists) {
                        if (lists.hasOwnProperty(i)) {
                            allLists.set(lists[i].ListId.value, lists[i].Name.value.toLowerCase());
                        }
                    }
                    this.lists = allLists.asImmutable();

                    // respond
                    if (this.lists.has(listIdNum)) {
                        // resolve it
                        const newParts = [this.lists.get(listIdNum)];
                        return resolve(spliceURL(parts, newParts, listIdIndex));
                    }

                    // skip it
                    return resolve(true);
                });
            });
        }
    }
}

/**
 * Resolves sample routes dynamically
 * rd/samples/14/... -> /samples/sampleSetByName/14/... || /media/batches/14
 */
export class SamplesResolver implements AppRouteResolver {
    samples: Map<number, List<string>>; // Map<SampleRowId, List<'samples' | 'media', sampleSetName | 'batches'>>

    constructor(samples?: Map<number, List<string>>) {
        this.samples = samples !== undefined ? samples : Map<number, List<string>>();
    }

    matches(route: string): boolean {
        return /\/rd\/samples\/(\d+$|\d+\/)/.test(route);
    }

    fetch(parts: any[]): Promise<AppURL | boolean> {
        // ["rd", "samples", "118", ...]
        const sampleRowIdIndex = 2;
        const sampleRowId: number = parseInt(parts[sampleRowIdIndex], 10);

        if (isNaN(sampleRowId)) {
            // skip it
            return Promise.resolve(true);
        } else if (this.samples.has(sampleRowId)) {
            // resolve it
            const newParts = this.samples.get(sampleRowId).toArray();
            return Promise.resolve(spliceURL(parts, newParts, 0, 2));
        } else {
            // fetch it
            return new Promise(resolve => {
                return selectRows({
                    schemaName: SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                    queryName: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                    columns: 'RowId,SampleSet',
                    filterArray: [Filter.create('RowId', sampleRowId)],
                })
                    .then(result => {
                        const samples = result.models[result.key];

                        if (samples && samples[sampleRowId]) {
                            const sample = samples[sampleRowId],
                                sampleSetName = sample['SampleSet'].displayValue.toLowerCase();

                            return getQueryDetails({
                                schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
                                queryName: sampleSetName,
                            })
                                .then(info => {
                                    if (info) {
                                        if (info.isMedia) {
                                            // for supporting MIXTURE_BATCHES => batches
                                            this.samples = this.samples.set(
                                                sampleRowId,
                                                List([
                                                    'media',
                                                    info.name.toLowerCase() ===
                                                    SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase()
                                                        ? 'batches'
                                                        : info.name,
                                                ])
                                            );
                                        } else {
                                            this.samples = this.samples.set(
                                                sampleRowId,
                                                List([
                                                    SCHEMAS.SAMPLE_SETS.SCHEMA.toLowerCase(),
                                                    encodeURIComponent(sampleSetName),
                                                ])
                                            );
                                        }
                                    }

                                    if (this.samples.has(sampleRowId)) {
                                        const newParts = this.samples.get(sampleRowId).toArray();
                                        return resolve(spliceURL(parts, newParts, 0, 2));
                                    }
                                })
                                .catch(() => {
                                    resolve(true);
                                });
                        }

                        // skip it
                        return resolve(true);
                    })
                    .catch(() => {
                        return resolve(true);
                    });
            });
        }
    }
}
