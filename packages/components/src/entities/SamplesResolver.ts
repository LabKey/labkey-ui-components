import { List, Map } from 'immutable';

import { Filter } from '@labkey/api';

import { AppRouteResolver } from '../internal/url/models';
import { AppURL, spliceURL } from '../internal/url/AppURL';
import { selectRows } from '../internal/query/selectRows';
import { SCHEMAS } from '../internal/schemas';

import { caseInsensitive } from '../internal/util/utils';
import { getQueryDetails } from '../internal/query/api';
import { MEDIA_KEY, SAMPLE_TYPE_KEY } from '../internal/app/constants';

/**
 * Resolves sample routes dynamically
 * /rd/samples/14/... -> /samples/sampleSetByName/14/... || /media/batches/14
 */
export class SamplesResolver implements AppRouteResolver {
    cacheName = SAMPLE_TYPE_KEY;

    samples: Map<number, List<string>>; // Map<SampleRowId, List<'samples' | 'media', sampleSetName | 'batches'>>
    initSamples: Map<number, List<string>>;

    constructor(samples?: Map<number, List<string>>) {
        this.init(samples);
        this.initSamples = samples;
    }

    init(samples?: Map<number, List<string>>): void {
        const initSamples = samples ?? this.initSamples;
        this.samples = initSamples !== undefined ? initSamples : Map<number, List<string>>();
    }

    clearCache() : void {
        this.init();
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
                    value = List([MEDIA_KEY, encodeURIComponent(mediaTypeName)]);
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
