import { Map } from 'immutable';

import { Filter } from '@labkey/api';

import { AppRouteResolver } from '../internal/url/models';
import { AppURL, spliceURL } from '../internal/url/AppURL';
import { fetchProtocol } from '../internal/components/domainproperties/assay/actions';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { selectRows } from '../internal/query/selectRows';

import { SCHEMAS } from '../internal/schemas';
import { caseInsensitive } from '../internal/util/utils';

/**
 * Resolves Assay routes dynamically
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
