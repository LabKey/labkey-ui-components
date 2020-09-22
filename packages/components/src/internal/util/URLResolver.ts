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
import { fromJS, List, Map } from 'immutable';
import { ActionURL, Experiment, Filter } from '@labkey/api';

import { AppURL } from '../url/AppURL';
import { LineageLinkMetadata } from '../components/lineage/types';

import { ActionMapper, URLMapper, URLService } from './URLService';

interface MapURLOptions {
    column: any;
    url: string;
    row: any;
    query?: string;
    schema?: string;
}

class LookupMapper implements URLMapper {
    defaultPrefix: string;
    lookupResolvers: any;

    constructor(defaultPrefix: string, lookupResolvers) {
        this.defaultPrefix = defaultPrefix;
        this.lookupResolvers = lookupResolvers;
    }

    resolve(url, row, column, schema, query): AppURL {
        if (column.has('lookup')) {
            var lookup = column.get('lookup'),
                schema = lookup.get('schemaName'),
                query = lookup.get('queryName'),
                queryKey = [schema, query].join('-').toLowerCase(),
                schemaKey = schema.toLowerCase();

            if (this.lookupResolvers) {
                if (this.lookupResolvers[queryKey]) {
                    return this.lookupResolvers[queryKey](row, column, schema, query);
                }
                if (this.lookupResolvers[schemaKey]) {
                    return this.lookupResolvers[schemaKey](row, column, schema, query);
                }
            }

            const parts = [
                this.defaultPrefix,
                lookup.get('schemaName'),
                lookup.get('queryName'),
                row.get('value').toString(),
            ];

            return AppURL.create(...parts);
        }
    }
}

const ASSAY_MAPPERS = [
    new ActionMapper('assay', 'assayDetailRedirect', row => {
        if (row.has('url')) {
            const rowURL = row.get('url');
            const params = ActionURL.getParameters(rowURL);

            // expecting a parameter of runId=<runId>
            if (params.hasOwnProperty('runId')) {
                const runId = params['runId'];

                const url = ['rd', 'assayrun', runId];
                return AppURL.create(...url);
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
                            const url = ['assays'].concat(schema.replace('assay.', '').split('.'));
                            url.push('batches', rowId);

                            return AppURL.create(...url);
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
                return AppURL.create('assays', params.rowId);
            }
        }
    }),

    new ActionMapper('assay', 'assayResults', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            const rowId = params.rowId;

            if (rowId) {
                delete params.rowId; // strip the rowId and pass through the remaining params
                return AppURL.create('assays', rowId, 'data').addParams(params);
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
        } else if (column.has('lookup')) {
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

            const url = ['rd', 'expdata', params.rowId];
            return AppURL.create(...url);
        }
    }),
];

const SAMPLE_TYPE_MAPPERS = [
    new ActionMapper('experiment', 'showSampleType', (row, column) => {
        let identifier: string;

        if (row.has('data')) {
            // search link doesn't use the same url
            identifier = row.getIn(['data', 'name']);
        } else if (column.has('lookup')) {
            identifier = row.get('displayValue').toString();
        } else {
            identifier = row.get('value').toString();
        }

        if (identifier !== undefined) {
            let url: string[];

            if (isNaN(parseInt(identifier))) {
                // string -- assume sample set name
                url = ['samples', identifier];
            } else {
                // numeric -- assume rowId and use resolver
                url = ['rd', 'samples', identifier];
            }

            return AppURL.create(...url);
        }
    }),

    new ActionMapper('experiment', 'showMaterial', row => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);
            const rowId = params.rowId;

            const url = ['rd', 'samples', rowId];

            if (rowId !== undefined) {
                return AppURL.create(...url);
            }
        }
    }),
];

const LIST_MAPPERS = [
    new ActionMapper('list', 'details', (row, column) => {
        if (!column.has('lookup')) {
            const params = ActionURL.getParameters(row.get('url'));

            const parts = ['q', 'lists', params.listId, params.pk];

            return AppURL.create(...parts);
        }
    }),

    new ActionMapper('list', 'grid', (row, column) => {
        if (!column.has('lookup')) {
            const params = ActionURL.getParameters(row.get('url'));

            const parts = ['q', 'lists', params.listId];

            return AppURL.create(...parts);
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
                const parts = ['q', schemaName, queryName, key];

                return AppURL.create(...parts);
            }
        }
    }
});

const EXECUTE_QUERY_MAPPER = new ActionMapper('query', 'executeQuery', () => false);

const USER_DETAILS_MAPPERS = [
    new ActionMapper('user', 'details', (row, column, schema, query) => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            return AppURL.create('q', 'core', 'siteusers', params.userId);
        }
    }),

    new ActionMapper('user', 'attachmentDownload', () => false)
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

export const URL_MAPPERS = {
    ASSAY_MAPPERS,
    DATA_CLASS_MAPPERS,
    SAMPLE_TYPE_MAPPERS,
    LIST_MAPPERS,
    DETAILS_QUERY_ROW_MAPPER,
    EXECUTE_QUERY_MAPPER,
    USER_DETAILS_MAPPERS,
    DOWNLOAD_FILE_LINK_MAPPER,
    AUDIT_DETAILS_MAPPER,
    LOOKUP_MAPPER,
};

export class URLResolver {
    private mapURL = (mapper: MapURLOptions): string => {
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

        if (_url !== false && LABKEY.devMode) {
            console.warn('Unable to map URL:', mapper.url);
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

        if (item.type && acceptedTypes.indexOf(item.type) >= 0 && item.cpasType) {
            const parts = item.cpasType.split(':');
            let name = parts[parts.length - 1];

            // LSID strings are 'application/x-www-form-urlencoded' encoded which replaces space with '+'
            name = name.replace(/\+/g, ' ');

            // Create a URL that will be resolved/redirected in the application resolvers
            const listURLParts = item.type === 'Sample' ? ['samples', name] : ['rd', 'dataclass', name];

            // listURL is the url to the grid for the data type. It will be filtered to the lineage members.
            metadata.list = AppURL.create(...listURLParts).toHref();

            const overviewURL = this.mapURL({
                url: item.url,
                row: item,
                column: Map<string, any>(),
                schema: item.schemaName,
                query: item.queryName,
            });

            metadata.overview = overviewURL;
            metadata.lineage = overviewURL + '/lineage';
        }

        return metadata;
    };

    /**
     * Returns a Promise resolving a valid selectRowsResult with URLs replaced with those mapped by this
     * URLResolver.
     * @param json - selectRowsResult
     * @returns {Promise<T>}
     */
    resolveSelectRows(json): Promise<any> {
        // TODO: Do not return a Promise. This method doesn't actually do anything async, so it does not need to be a
        //  promise.
        return new Promise(resolve => {
            let resolved = fromJS(JSON.parse(JSON.stringify(json)));

            if (resolved.get('rows').count()) {
                const schema = resolved.get('schemaName').toJS().join('.');
                const query = resolved.get('queryName');
                const fields = resolved.getIn(['metaData', 'fields']).reduce((fields, column) => {
                    return fields.set(column.get('fieldKey'), column);
                }, Map());

                const rows = resolved.get('rows').map(row => {
                    return row.map((cell, fieldKey) => {
                        // single-value cells
                        if (Map.isMap(cell) && cell.has('url')) {
                            return cell.set(
                                'url',
                                this.mapURL({
                                    url: cell.get('url'),
                                    row: cell,
                                    column: fields.get(fieldKey),
                                    schema,
                                    query,
                                })
                            );
                        }

                        // multi-value cells
                        if (List.isList(cell) && cell.size > 0) {
                            return cell
                                .map(innerCell => {
                                    if (Map.isMap(innerCell) && innerCell.has('url')) {
                                        return innerCell.set(
                                            'url',
                                            this.mapURL({
                                                url: innerCell.get('url'),
                                                row: innerCell,
                                                column: fields.get(fieldKey),
                                                schema,
                                                query,
                                            })
                                        );
                                    }

                                    return innerCell;
                                })
                                .toList();
                        }

                        return cell;
                    });
                });

                resolved = resolved.set('rows', rows);
            }

            resolve(resolved.toJS());
        });
    }

    // ToDo: this is rather fragile and data specific. this should be reworked with the mappers and rest of the resolvers to provide for more thorough coverage of our incoming URLs
    resolveSearchUsingIndex(json): Promise<{}> {
        return new Promise(resolve => {
            let resolved = fromJS(JSON.parse(JSON.stringify(json)));

            if (resolved.get('hits').count()) {
                const rows = resolved.get('hits').map(row => {
                    if (row && row.has('url')) {
                        let url = row.get('url'),
                            id = row.get('id'),
                            column = List(); // no columns, so providing an empty List to the resolver
                        let query;

                        // TODO: add reroute for assays/runs when pages and URLs are decided
                        if (row.has('data') && row.hasIn(['data', 'dataClass'])) {
                            query = row.getIn(['data', 'dataClass', 'name']); // dataClass is nested Map/Object inside of 'data' return
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (id.indexOf('dataClass') >= 0) {
                            query = row.getIn(['data', 'name']);
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (id.indexOf('materialSource') >= 0) {
                            query = row.getIn(['data', 'name']);
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (id.indexOf('assay') >= 0) {
                            query = row.getIn(['title']);
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (id.indexOf('material') != -1 && row.hasIn(['data', 'sampleSet'])) {
                            query = row.getIn(['data', 'sampleSet', 'name']);
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (row.has('data') && row.hasIn(['data', 'id'])) {
                            query = row.getIn(['data', 'type']);
                            return row.set('url', this.mapURL({ url, row, column, query }));
                        } else if (id.indexOf('samplemanagerJob') >= 0) {
                            return row.set('url', this.mapURL({ url, row, column }));
                        } else if (url.indexOf('samplemanager-downloadAttachments') >= 0) {
                            return row.set('url', this.mapURL({ url, row, column }));
                        }
                    }
                    return row;
                });

                resolved = resolved.set('hits', rows);
            }

            resolve(resolved.toJS());
        });
    }
}
