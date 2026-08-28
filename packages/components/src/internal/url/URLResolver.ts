/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, Map as ImmutableMap, List, OrderedSet } from 'immutable';
import { ActionURL, Experiment, Filter, getServerContext, Query } from '@labkey/api';

import { LineageLinkMetadata } from '../components/lineage/types';

import { ADMIN_KEY, BOXES_KEY, FREEZER_MANAGER_APP_PROPERTIES, SAMPLES_KEY } from '../app/constants';

import { getCurrentAppProperties, getProjectPath } from '../app/utils';

import { QueryInfo } from '../../public/QueryInfo';

import { QueryColumn } from '../../public/QueryColumn';

import { SearchHit, SearchResult } from '../components/search/actions';

import { SearchCategory } from '../components/search/constants';

import { AppURL } from './AppURL';
import { AppRouteResolver } from './models';
import { encodeListResolverPath } from './utils';
import { Row, RowValue } from '../query/selectRows';

let resolvers = OrderedSet<AppRouteResolver>();

let urlMappers: List<URLMapper> = List<URLMapper>();

export type URLMapperResolverValue = AppURL | boolean | string;
export type URLMapperResolver = (
    url: string,
    row: ImmutableMap<string, any>,
    column: QueryColumn,
    schemaName: string,
    queryName: string
) => URLMapperResolverValue;

export interface URLMapper {
    resolve: URLMapperResolver;
}

export namespace URLService {
    export function getUrlMappers(): List<URLMapper> {
        return urlMappers;
    }

    export function registerAppRouteResolvers(...appRouteResolvers: AppRouteResolver[]): void {
        appRouteResolvers.forEach(resolver => {
            if (resolver) {
                resolvers = resolvers.add(resolver);
            }
        });
    }

    export async function resolveRedirect(path: string): Promise<string> {
        const resolver = resolvers.find(r => r.matches(path));

        if (resolver === undefined) return undefined;

        const parts = path.split('/');
        parts.shift(); // account for initial '/'
        const redirectPath = await resolver.fetch(parts);
        return redirectPath?.toString();
    }

    export function registerURLMappers(...mappers: URLMapper[]): void {
        urlMappers = urlMappers.concat(mappers) as List<URLMapper>;
    }

    export function clearCache(cacheKey?: string): void {
        resolvers.forEach(resolver => {
            if (!cacheKey || resolver.cacheName === cacheKey) resolver.clearCache?.();
        });
    }
}

export type LookupResolver = (
    row: ImmutableMap<string, any>,
    column?: QueryColumn,
    schemaName?: string,
    queryName?: string
) => URLMapperResolverValue;

export class ActionMapper implements URLMapper {
    controller: string;
    action: string;
    resolver: LookupResolver;
    productId: string;

    constructor(controller: string, action: string, resolver: LookupResolver, productId?: string) {
        this.controller = controller.toLowerCase();
        this.action = action.toLowerCase();
        this.resolver = resolver;
        this.productId = productId;
    }

    getProductUrl = (url: AppURL): AppURL | string => {
        return url.toHref();
    };

    resolve: URLMapperResolver = (url, row, column, schemaName, queryName) => {
        if (url) {
            const parsed = ActionURL.getPathFromLocation(url);

            if (parsed.action.toLowerCase() === this.action && parsed.controller.toLowerCase() === this.controller) {
                const resolvedUrl = this.resolver(row, column, schemaName, queryName);
                return resolvedUrl instanceof AppURL ? this.getProductUrl(resolvedUrl) : resolvedUrl;
            }
        }
    };
}

interface MapURLOptions {
    column?: QueryColumn;
    query?: string;
    row: any;
    schema?: string;
    url: string;
}

// exported for jest tests
export class LookupMapper implements URLMapper {
    defaultPrefix: string;
    lookupResolvers: Record<string, LookupResolver>;

    constructor(defaultPrefix: string, lookupResolvers: Record<string, LookupResolver>) {
        this.defaultPrefix = defaultPrefix;
        this.lookupResolvers = lookupResolvers;
    }

    resolve: URLMapperResolver = (url, row, column) => {
        if (column?.isLookup()) {
            const { lookup } = column;
            const { containerPath: lookupContainerPath, queryName, schemaName } = lookup;
            const queryKey = [schemaName, queryName].join('-').toLowerCase();
            const schemaKey = schemaName.toLowerCase();

            if (this.lookupResolvers) {
                if (this.lookupResolvers[queryKey]) {
                    return this.lookupResolvers[queryKey](row, column, schemaName, queryName);
                }
                if (this.lookupResolvers[schemaKey]) {
                    return this.lookupResolvers[schemaKey](row, column, schemaName, queryName);
                }
            }

            // Issue 46747: When the lookup goes to a different container, don't rewrite the URL
            const containerPath = getServerContext().container.path;
            if (lookupContainerPath && lookupContainerPath !== containerPath) {
                return undefined;
            }

            const parts = [this.defaultPrefix, schemaName, queryName, row.get('value').toString()];

            return AppURL.create(...parts);
        }
    };
}

const ASSAY_MAPPERS = [
    new ActionMapper('assay', 'assayDetailRedirect', row => {
        if (row.has('url')) {
            const rowURL = row.get('url');
            const params = ActionURL.getParameters(rowURL);

            // expecting a parameter of runId=<runId>
            if (params.hasOwnProperty('runId')) {
                return AppURL.create('rd', 'assayrun', params['runId']);
            }
        }
    }),

    new ActionMapper('assay', 'assayRuns', (row, column, schema) => {
        if (row.has('url')) {
            const url = row.get('url');

            // expecting a filter on Batch/RowId~eq=<rowId>
            const filters = Filter.getFiltersFromUrl(url, 'Runs');
            if (filters.length > 0) {
                for (let i = 0; i < filters.length; i++) {
                    if (filters[i].getColumnName().toLowerCase() === 'batch/rowid') {
                        const rowId = filters[i].getValue();

                        // expecting a schema of assay.<provider>.<protocol>
                        if (schema.indexOf('assay.') === 0) {
                            const parts = schema.split('.');
                            const provider = parts[1];
                            // Issue 52780: the rest of the parts make up the protocol name, which may contain . chars
                            const protocol = parts.slice(2).join('.');
                            return AppURL.create('assays', provider, protocol, 'batches', rowId);
                        }
                    }
                }
            }
        }
    }),

    new ActionMapper('assay', 'assayBegin', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);

            if (params.rowId) {
                return AppURL.create('rd', 'assays', params.rowId);
            }
        }
    }),

    new ActionMapper('assay', 'assayResults', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            const rowId = params.rowId;

            if (rowId) {
                // filter on Data.Run/RowId~eq=<rowId>
                const filters = Filter.getFiltersFromUrl(url, 'Data');
                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i++) {
                        if (filters[i].getColumnName().toLowerCase() === 'run/rowid') {
                            if (Object.keys(params).length > 2) console.warn('Params mapping skipped for: ' + url);

                            const runId = filters[i].getValue();
                            return AppURL.create('rd', 'assayrun', runId);
                        }
                    }
                }

                delete params.rowId; // strip the rowId and pass through the remaining params
                return AppURL.create('assays', rowId, 'data').addParams(params);
            }
        }
    }),

    // Issue 52151: resolve assay runs from search results
    new ActionMapper('experiment', 'showRunGraph', row => {
        const url = row.get('url');
        if (url) {
            const hit: SearchHit = row.toJS();
            if (hit.category === SearchCategory.AssayRun) {
                const runId = parseInt(hit.data?.id, 10);
                if (!isNaN(runId)) {
                    return AppURL.create('rd', 'assayrun', runId);
                }
            }
        }
    }),

    // Issue 52151: resolve assay batches from search results
    new ActionMapper('experiment', 'details', row => {
        const url = row.get('url');
        if (url) {
            const hit: SearchHit = row.toJS();
            if (hit.category === SearchCategory.AssayBatch) {
                const batchRowId = parseInt(hit.data?.id, 10);
                if (!isNaN(batchRowId)) {
                    return AppURL.create('rd', 'assaybatch', batchRowId);
                }
            }
        }
    }),
];

const DATA_CLASS_MAPPERS = [
    new ActionMapper('experiment', 'showDataClass', (row, column) => {
        let identifier: string;

        // TODO: Deal with junction lookup
        if (row.has('data')) {
            // search link doesn't use the same url
            identifier = row.getIn(['data', 'name']);
        } else if (column?.isLookup()) {
            identifier = row.get('displayValue').toString();
        } else {
            identifier = row.get('value').toString();
        }
        if (identifier !== undefined) {
            return AppURL.create('rd', 'dataclass', identifier);
        }
    }),

    new ActionMapper('experiment', 'showData', row => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);

            if (params.rowId) {
                return AppURL.create('rd', 'expdata', params.rowId);
            }
        }
    }),
];

const SAMPLE_TYPE_MAPPERS = [
    new ActionMapper('experiment', 'showSampleType', (row, column) => {
        let identifier: string;

        if (row.has('data')) {
            // search link doesn't use the same url
            identifier = row.getIn(['data', 'name']);
        } else if (column?.isLookup()) {
            identifier = row.get('displayValue').toString();
        } else {
            identifier = row.get('value').toString();
        }

        if (identifier !== undefined) {
            return AppURL.create(SAMPLES_KEY, identifier);
        }
    }),

    new ActionMapper('experiment', 'showMaterial', row => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);
            const rowId = params.rowId;

            if (rowId !== undefined) {
                return AppURL.create('rd', 'samples', rowId);
            } else {
                return false;
            }
        }
    }),
];

const RESOLVE_LSID_MAPPERS = [
    new ActionMapper('experiment', 'resolveLsid', (row, column) => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);
            if (params.type) {
                const type = params.type;
                const lsid = params.lsid;
                if (lsid) {
                    if (type?.toLowerCase() === 'data') {
                        return AppURL.create('rd', 'expdata', lsid);
                    } else if (type?.toLowerCase() === 'material') {
                        return AppURL.create('rd', 'samples', lsid);
                    }
                }
                return null; // return null for 'run' so LKS url will be used, don't return undefined
            }
        }
    }),
];

const LIST_MAPPERS = [
    new ActionMapper('list', 'details', (row, column) => {
        if (!column?.isLookup()) {
            const params = ActionURL.getParameters(row.get('url'));
            const urlParts = ActionURL.getPathFromLocation(row.get('url'));

            if (params?.pk) {
                if (params.name) {
                    return AppURL.create('q', 'lists', params.name, params.pk);
                } else if (params.listId && urlParts?.containerPath) {
                    const resolverPath = encodeListResolverPath(urlParts.containerPath);
                    return AppURL.create('q', 'lists', resolverPath, params.listId, params.pk);
                }
            }
        }
    }),

    new ActionMapper('list', 'grid', (row, column) => {
        if (!column?.isLookup()) {
            const params = ActionURL.getParameters(row.get('url'));
            const urlParts = ActionURL.getPathFromLocation(row.get('url'));

            if (params) {
                if (params.name) {
                    return AppURL.create('q', 'lists', params.name);
                } else if (params.listId && urlParts?.containerPath) {
                    const resolverPath = encodeListResolverPath(urlParts.containerPath);
                    return AppURL.create('q', 'lists', resolverPath, params.listId);
                }
            }
        }
    }),
];

const DETAILS_QUERY_ROW_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];

        if (schemaName && queryName) {
            const key = params.keyValue ? params.keyValue : params.RowId;

            if (key !== undefined) {
                return AppURL.create('q', schemaName, queryName, key);
            }
        }
    }
});

const EXECUTE_QUERY_MAPPER = new ActionMapper('query', 'executeQuery', () => false);

const USER_DETAILS_MAPPERS = [
    new ActionMapper('user', 'details', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            return AppURL.create('q', 'core', 'siteusers', params.userId);
        }
    }),

    new ActionMapper('user', 'attachmentDownload', () => false),
];

const DOWNLOAD_FILE_LINK_MAPPER = new ActionMapper('core', 'downloadFileLink', () => false);

const AUDIT_DETAILS_MAPPER = new ActionMapper('audit', 'detailedAuditChanges', () => false);

const LOOKUP_MAPPER = new LookupMapper('q', {
    'exp-dataclasses': row =>
        row.get('displayValue') ? AppURL.create('rd', 'dataclass', row.get('displayValue')) : undefined,
    'exp-runs': row => {
        const runId = row.get('value');
        if (!isNaN(parseInt(runId))) {
            return AppURL.create('rd', 'assayrun', runId);
        }
        return false;
    },
    issues: () => false, // 33680: Prevent remapping issues lookup
});

export const PIPELINE_MAPPER = new ActionMapper('pipeline-status', 'details', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        return AppURL.create('pipeline', params.rowId);
    }
    return false;
});

export const PICKLIST_MAPPER = new ActionMapper('picklist', 'grid', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        if (params.listId) {
            return AppURL.create('picklist', params.listId);
        }
    }
    return false;
});

export const FREEZER_ITEM_SAMPLE_MAPPER = new ActionMapper('query', 'executeQuery', row => {
    const url = row.get('url');
    if (url) {
        const materialIdKey = 'query.MaterialId~eq';
        const params = ActionURL.getParameters(url);
        if (
            params.schemaName &&
            params.schemaName.toLowerCase() === 'inventory' &&
            params.queryName &&
            params.queryName.toLowerCase() === 'item'
        ) {
            if (params[materialIdKey]) {
                return AppURL.create('rd', 'sampleItem', params[materialIdKey]).setProductId(
                    FREEZER_MANAGER_APP_PROPERTIES.productId
                );
            } else {
                return ''; // don't try to show a link if there's no materialId Issue 49679
            }
        }
    }
    return undefined;
});

// This mapper overrides the URL provided for the core.ProjectManagement query.
// We're linking to #/admin/settings within a specific folder (which may be outside the current folder context).
export const PROJECT_MGMT_MAPPER = new ActionMapper('project', 'begin', (row, column, schema, query) => {
    const url = row.get('url');

    // Only match against the core.ProjectManagement query
    if (url && schema?.toLowerCase() === 'core' && query?.toLowerCase() === 'projectmanagement') {
        const { containerPath } = ActionURL.getPathFromLocation(url);
        const { controllerName } = getCurrentAppProperties();
        const baseURL = ActionURL.buildURL(controllerName, 'app.view', containerPath);
        return baseURL + AppURL.create(ADMIN_KEY, 'settings').toHref();
    }

    // Allow resolution of 'project-begin' to fall through to other mappers
    return undefined;
});

// query-detailsQueryRow.view?schemaName=inventory&query.queryName=Location&RowId=1811
// map to /rd/freezerLocation/1811
export const STORAGE_LOCATION_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];
        if (
            schemaName &&
            schemaName.toLowerCase() === 'inventory' &&
            queryName &&
            queryName.toLowerCase() === 'location'
        ) {
            const rowId = params.RowId;
            if (rowId && rowId.length) {
                return AppURL.create('rd', 'freezerLocation', rowId).setProductId(
                    FREEZER_MANAGER_APP_PROPERTIES.productId
                );
            }
            return false;
        }
    }
    return undefined;
});

// query-detailsQueryRow.view?schemaName=inventory&query.queryName=Box&RowId=2918
// map to boxes/24363?query.sort=WellPosition
export const STORAGE_BOX_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];
        if (schemaName && schemaName.toLowerCase() === 'inventory' && queryName && queryName.toLowerCase() === 'box') {
            const rowId = params.RowId;
            if (rowId && rowId.length) {
                return AppURL.create(BOXES_KEY, rowId)
                    .addParams({ 'query.sort': 'WellPosition' })
                    .setProductId(FREEZER_MANAGER_APP_PROPERTIES.productId);
            }
            return false;
        }
    }
    return undefined;
});

export const URL_MAPPERS = {
    ASSAY_MAPPERS,
    DATA_CLASS_MAPPERS,
    SAMPLE_TYPE_MAPPERS,
    RESOLVE_LSID_MAPPERS,
    LIST_MAPPERS,
    PICKLIST_MAPPER,
    DETAILS_QUERY_ROW_MAPPER,
    EXECUTE_QUERY_MAPPER,
    USER_DETAILS_MAPPERS,
    DOWNLOAD_FILE_LINK_MAPPER,
    AUDIT_DETAILS_MAPPER,
    LOOKUP_MAPPER,
    PIPELINE_MAPPER,
    FREEZER_ITEM_SAMPLE_MAPPER,
    PROJECT_MGMT_MAPPER,
    STORAGE_LOCATION_MAPPER,
    STORAGE_BOX_MAPPER,
};

// Search hit urls carry the docID parameter. Strip it so that it does not propagate to application urls.
const stripDocIdParam = (url: string): string => {
    let stripped = url;
    for (const separator of ['&_docid', '?_docid']) {
        const index = stripped.indexOf(separator);
        if (index > -1) stripped = stripped.substring(0, index);
    }
    return stripped;
};

const hasURL = (cell: RowValue): boolean => !!cell?.hasOwnProperty('url');

export class URLResolver {
    private mapURL = (mapper: MapURLOptions): string => {
        // Don't override URLs if the URL has a different container than the current container and is not in the folder
        // tree of the current container. This scopes the apps to their current container and container tree, and supports
        // adding FKs from other containers and preserving the URL from the server.
        if (mapper.url) {
            const urlPath = ActionURL.getPathFromLocation(mapper.url).containerPath;

            if (urlPath) {
                const currentPath = getServerContext().container.path;

                // not current container AND not same top-level folder
                if (urlPath !== currentPath && getProjectPath(currentPath) !== getProjectPath(urlPath)) {
                    return mapper.url;
                }
            }
        }

        const _url = URLService.getUrlMappers()
            .toSeq()
            .map(m => m.resolve(mapper.url, mapper.row, mapper.column, mapper.schema, mapper.query))
            .filter(v => v !== undefined)
            .first();

        if (_url instanceof AppURL) {
            return _url.toHref();
        }

        if (typeof _url === 'string') {
            return _url;
        }

        if (mapper.url !== undefined && _url !== false && getServerContext().devMode) {
            // Don't bother logging the default server URL
            if (!mapper.url.indexOf('project-begin')) {
                console.warn('Unable to map URL:', mapper.url);
            }
        }

        return mapper.url;
    };

    resolveLineageItem = (
        item: Experiment.LineageItemBase,
        acceptedTypes: string[] = ['Sample', 'Data']
    ): LineageLinkMetadata => {
        const metadata: LineageLinkMetadata = {
            lineage: undefined,
            list: undefined,
            overview: item.url,
        };

        if (item.restricted) {
            return metadata;
        }

        if (item.type && acceptedTypes.indexOf(item.type) >= 0 && (item.queryName || item.cpasType || item.lsid)) {
            // Issue 48836: Resolve lineage item URL from queryName if available
            let name = item.queryName;

            if (!name) {
                // Fallback to parsing name from cpasType
                const parts = item.cpasType.split(':');
                name = parts[parts.length - 1];

                // LSID strings are 'application/x-www-form-urlencoded' encoded which replaces space with '+'
                name = name.replace(/\+/g, ' ');
            }

            // Create a URL that will be resolved/redirected in the application resolvers
            const listURLParts = item.type === 'Sample' ? [SAMPLES_KEY, name] : ['rd', 'dataclass', name];

            // listURL is the url to the grid for the data type. It will be filtered to the lineage members.
            metadata.list = AppURL.create(...listURLParts).toHref();

            const overviewURL = this.mapURL({
                url: item.url,
                row: item,
                column: undefined,
                schema: item.schemaName,
                query: item.queryName,
            });

            metadata.overview = overviewURL;
            metadata.lineage = overviewURL + '/lineage';
        }

        return metadata;
    };

    /**
     * Returns a valid selectRowsResult with URLs replaced with those mapped by this URLResolver.
     */
    resolveSelectRows(response: Query.Response, queryInfo: QueryInfo): any {
        // Callers pass a Query.Response, whose rows are Row instances and whose metadata field keys are
        // FieldKey/SchemaKey instances. toJSON() flattens those to the plain strings that the field lookup and
        // QueryColumn below require.
        const resolved = JSON.parse(JSON.stringify(response));

        // If no url mappers defined, then this is a noop. Using URLs as they are.
        if (!URLService.getUrlMappers()?.size || !resolved.rows?.length) return resolved;

        const schema = resolved.schemaName.join('.');
        const query = resolved.queryName;

        const fields = new Map<string, QueryColumn>(
            resolved.metaData?.fields?.map(field => [field.fieldKey, new QueryColumn(field)]) ?? []
        );

        const mapCell = (cell: RowValue, fieldKey: string): RowValue => ({
            ...cell,
            url: this.mapURL({
                url: cell.url,
                // Mappers consume the cell through the Immutable API
                row: fromJS(cell),
                column: fields.get(fieldKey) ?? queryInfo?.getColumn(fieldKey),
                schema,
                query,
            }),
        });

        resolved.rows = (resolved.rows as Row[]).map(row =>
            Object.fromEntries(
                Object.entries(row).map(([fieldKey, cell]) => {
                    // multi-value cells
                    if (Array.isArray(cell)) {
                        return [
                            fieldKey,
                            cell.map(innerCell => (hasURL(innerCell) ? mapCell(innerCell, fieldKey) : innerCell)),
                        ];
                    }

                    // single-value cells
                    if (hasURL(cell)) return [fieldKey, mapCell(cell, fieldKey)];

                    return [fieldKey, cell];
                })
            )
        );

        return resolved;
    }

    resolveSearchUsingIndex(result: SearchResult): SearchResult {
        if (!result?.hits?.length) return result;

        result.hits = result.hits.map(hit => {
            if (!hit || hit.url === undefined) return hit;

            const { id, url } = hit;
            let query: string;

            // TODO: This should be refactored to be based off hit.category (SearchCategory) matching
            if (hit.data?.dataClass) {
                query = hit.data.dataClass.name;
            } else if (id.includes('dataClass') || id.includes('materialSource')) {
                query = hit.data?.name;
            } else if (id.includes('assay')) {
                query = hit.title;
            } else if (id.includes('material') && hit.data?.sampleSet) {
                query = hit.data.sampleSet.name;
            } else if (hit.data?.id !== undefined) {
                query = hit.data.type;
            } else if (url.includes('plate-designer')) {
                query = hit.data?.rowId;
            } else if (url.includes('query-queryDetailsRow') && url.includes('.queryName=PlateSet&')) {
                query = hit.data?.rowId;
            }

            // Any hit that matched no case above is still mapped, on its url alone.
            return { ...hit, url: this.mapURL({ url: stripDocIdParam(url), row: fromJS(hit), query }) };
        });

        return result;
    }
}
