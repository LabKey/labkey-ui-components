/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, Map as ImmutableMap } from 'immutable';
import { Query } from '@labkey/api';

import entitiesJSON from '../../test/data/sampleSetSearchResult.json';
import lineageJSON from '../../test/data/experiment-lineage.json';
import { LineageResult } from '../components/lineage/models';

import { registerDefaultURLMappers } from '../test/testHelpers';

import { QueryColumn, QueryLookup } from '../../public/QueryColumn';
import { ExtendedMap } from '../../public/ExtendedMap';
import { QueryInfo } from '../../public/QueryInfo';

import { SearchCategory } from '../components/search/constants';
import { SearchHit, SearchResult } from '../components/search/actions';
import { TEST_PROJECT_CONTAINER } from '../containerFixtures';

import { AppURL } from './AppURL';
import { LookupMapper, URLResolver, URLService } from './URLResolver';

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };

    registerDefaultURLMappers();
});

describe('URLResolver', () => {
    function resolveUrl(url: string, schemaName: string): AppURL | boolean | string {
        return URLService.getUrlMappers()
            .toSeq()
            .map(m => m.resolve(url, fromJS({ url }), undefined, schemaName, undefined))
            .filter(v => v !== undefined)
            .first();
    }

    describe('ActionMapper', () => {
        test('assayRuns', () => {
            let url = '/Biologics%20Example/assay-assayOther.view?rowId=636&Runs.Batch%2FRowId~eq=6169';
            let result = resolveUrl(url, 'assay.General.testProtocol');
            expect(result).toBe(undefined);

            url = '/Biologics%20Example/assay-assayRuns.view?rowId=636&Runs.Run%2FRowId~eq=6169';
            result = resolveUrl(url, 'assay.General.testProtocol');
            expect(result).toBe(undefined);

            url = '/Biologics%20Example/assay-assayRuns.view?rowId=636&Runs.Batch%2FRowId~eq=6169';
            result = resolveUrl(url, 'assay.General.testProtocol');
            expect(result.toString()).toBe('#/assays/General/testProtocol/batches/6169');

            url = '/Biologics%20Example/assay-assayRuns.view?rowId=636&Runs.Batch%2FRowId~eq=6169';
            result = resolveUrl(url, 'assay.General.test,./Protocol..');
            expect(result.toString()).toBe('#/assays/General/test%2C.%2FProtocol../batches/6169');
        });
    });

    describe('resolveSearchUsingIndex', () => {
        const resolver = new URLResolver();

        function createSearchResult(searchHit: SearchHit): SearchResult {
            return {
                hits: [searchHit],
                metaData: {
                    idProperty: 'id',
                    root: 'hits',
                    successProperty: 'success',
                },
                q: 'searchQuery',
                success: true,
                totalHits: 1,
            };
        }

        test('resolve sample type url', () => {
            const resolved = resolver.resolveSearchUsingIndex(entitiesJSON);
            expect(resolved).toHaveProperty(['hits']);
            expect(resolved).toHaveProperty(['hits', 0]);
            expect(resolved).toHaveProperty(['hits', 0, 'url'], '#/samples/Molecule');
            expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], 'Molecule'); // not sure if this is best place to check this...
        });

        test('assay batch', () => {
            // Arrange
            const assayBatchRowId = 3927119;
            const assayRunSearchHit: SearchHit = {
                category: SearchCategory.AssayBatch,
                container: TEST_PROJECT_CONTAINER.id,
                data: { id: assayBatchRowId },
                id: [SearchCategory.AssayBatch, assayBatchRowId].join(':'),
                title: 'Assay Batch - NY_Marathon_2023-06-09_15-03-39',
                url: `/labkey/testContainer/experiment-details.view?rowId=${assayBatchRowId}&_docid=assayRun%3A${assayBatchRowId}`,
            };

            // Act
            const searchResult = resolver.resolveSearchUsingIndex(createSearchResult(assayRunSearchHit));

            // Assert
            const [searchHit] = searchResult.hits;
            expect(searchHit.url).toEqual(`#/rd/assaybatch/${assayBatchRowId}`);
        });

        test('assay run', () => {
            // Arrange
            const assayRunRowId = 711392;
            const assayRunSearchHit: SearchHit = {
                category: SearchCategory.AssayRun,
                container: TEST_PROJECT_CONTAINER.id,
                data: { id: assayRunRowId },
                id: [SearchCategory.AssayRun, assayRunRowId].join(':'),
                title: 'Assay Run - NY_Marathon_2023-06-09_15-03-39',
                url: `/labkey/testContainer/experiment-showRunGraph.view?rowId=${assayRunRowId}&_docid=assayRun%3A${assayRunRowId}`,
            };

            // Act
            const searchResult = resolver.resolveSearchUsingIndex(createSearchResult(assayRunSearchHit));

            // Assert
            const [searchHit] = searchResult.hits;
            expect(searchHit.url).toEqual(`#/rd/assayrun/${assayRunRowId}`);
        });

        const UNMAPPED = '/labkey/testContainer/foo-bar.view?rowId=1';
        const UNMAPPED_DOC_ID = `${UNMAPPED}&_docid=abc%3A1`;

        function createResult(hits: unknown[], overrides: Record<string, unknown> = {}): any {
            return {
                hits,
                metaData: { idProperty: 'id', root: 'hits', successProperty: 'success' },
                q: 'searchQuery',
                success: true,
                totalHits: hits.length,
                ...overrides,
            };
        }

        test('returns the result as-is when there are no hits', () => {
            const result = createResult([]);
            expect(resolver.resolveSearchUsingIndex(result)).toEqual(result);
        });

        test('leaves hits without a url, and null hits, untouched', () => {
            const result = createResult([{ container: 'c', id: 'materialSource:1', title: 'No url' }, null]);
            const resolved = resolver.resolveSearchUsingIndex(result);

            expect(resolved.hits[0]).toEqual({ container: 'c', id: 'materialSource:1', title: 'No url' });
            expect(resolved.hits[1]).toBe(null);
        });

        test('preserves top-level result properties', () => {
            const result = createResult(
                [
                    {
                        data: { name: 'Molecule' },
                        id: 'materialSource:1',
                        url: '/labkey/testContainer/experiment-showSampleType.view?rowId=1&_docid=a',
                    },
                ],
                { totalHits: 42 }
            );
            const resolved = resolver.resolveSearchUsingIndex(result);

            expect(resolved.metaData).toEqual(result.metaData);
            expect(resolved.q).toBe('searchQuery');
            expect(resolved.success).toBe(true);
            expect(resolved.totalHits).toBe(42);
        });

        test('maps every hit', () => {
            const result = createResult([
                {
                    data: { name: 'Molecule' },
                    id: 'materialSource:1',
                    url: '/labkey/testContainer/experiment-showSampleType.view?rowId=1&_docid=a',
                },
                {
                    data: { name: 'Protein' },
                    id: 'materialSource:2',
                    url: '/labkey/testContainer/experiment-showSampleType.view?rowId=2&_docid=b',
                },
            ]);

            expect(resolver.resolveSearchUsingIndex(result).hits.map(hit => hit.url)).toEqual([
                '#/samples/Molecule',
                '#/samples/Protein',
            ]);
        });

        // Each branch of the hit-matching chain, exercised with a url no registered mapper resolves so that the
        // (possibly rewritten) url passed to mapURL is what comes back out.
        describe('hit matching', () => {
            interface CapturedHit {
                query: string;
                row: ImmutableMap<string, unknown>;
                url: string;
            }

            const captured: CapturedHit[] = [];

            beforeAll(() => {
                // Registered after the default mappers and always returns undefined, so it records without
                // affecting resolution. Mapper resolution is lazy, so it only sees urls no default mapper resolves.
                URLService.registerURLMappers({
                    resolve: (url, row, column, schemaName, queryName) => {
                        captured.push({ query: queryName, row, url });
                        return undefined;
                    },
                });
            });

            beforeEach(() => {
                captured.length = 0;
            });

            function resolveHit(hit: Record<string, unknown>): any {
                return resolver.resolveSearchUsingIndex(createResult([hit])).hits[0];
            }

            test('data class hit resolves the query from data.dataClass.name', () => {
                const hit = resolveHit({
                    data: { dataClass: { name: 'DC-1' } },
                    id: 'anything:1',
                    title: 'A title',
                    url: UNMAPPED_DOC_ID,
                });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['DC-1']);
            });

            test('dataClass id hit resolves the query from data.name', () => {
                const hit = resolveHit({ data: { name: 'DCName' }, id: 'dataClass:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['DCName']);
            });

            test('materialSource id hit resolves the query from data.name', () => {
                const hit = resolveHit({ data: { name: 'STName' }, id: 'materialSource:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['STName']);
            });

            test('assay id hit resolves the query from the title', () => {
                const hit = resolveHit({ id: 'assayRun:1', title: 'My Assay', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['My Assay']);
            });

            test('material id hit resolves the query from data.sampleSet.name', () => {
                const hit = resolveHit({
                    data: { sampleSet: { name: 'Hemoglobin' } },
                    id: 'material:1',
                    url: UNMAPPED_DOC_ID,
                });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['Hemoglobin']);
            });

            test('hit with data.id resolves the query from data.type', () => {
                const hit = resolveHit({ data: { id: 7, type: 'sampleSet' }, id: 'anything:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual(['sampleSet']);
            });

            test('workflow job hit maps with no query', () => {
                const hit = resolveHit({ id: 'workflowJob:12', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('strips an ampersand-delimited doc id from any hit', () => {
                const hit = resolveHit({ id: 'anything:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('strips a doc id that is the whole query string', () => {
                const hit = resolveHit({ id: 'anything:1', url: '/labkey/testContainer/foo-bar.view?_docid=a' });

                expect(hit.url).toBe('/labkey/testContainer/foo-bar.view');
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('workflow attachment hit maps with no query', () => {
                const hit = resolveHit({
                    id: 'anything:1',
                    url: '/labkey/testContainer/workflow-downloadAttachments.view?id=1&_docid=a',
                });

                expect(hit.url).toBe('/labkey/testContainer/workflow-downloadAttachments.view?id=1');
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('notebook hit maps with no query', () => {
                const hit = resolveHit({
                    id: 'anything:1',
                    url: '/labkey/testContainer/notebook-view.view?id=1&_docid=a',
                });

                expect(hit.url).toBe('/labkey/testContainer/notebook-view.view?id=1');
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('plate designer hit resolves the query from data.rowId', () => {
                const url = '/labkey/testContainer/plate-designer.view?rowId=3&_docid=a';
                const hit = resolveHit({ data: { rowId: 3 }, id: 'anything:1', url });

                expect(hit.url).toBe('/labkey/testContainer/plate-designer.view?rowId=3');
                expect(captured.map(c => c.query)).toStrictEqual([3]);
            });

            test('plate designer hit without a data.rowId is mapped on the url alone', () => {
                const url = '/labkey/testContainer/plate-designer.view?_docid=a';
                const hit = resolveHit({ data: {}, id: 'anything:1', url });

                expect(hit.url).toBe('/labkey/testContainer/plate-designer.view');
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('plate set details row hit resolves the query from data.rowId', () => {
                const url =
                    '/labkey/testContainer/query-queryDetailsRow.view?schemaName=assay.Plate&query.queryName=PlateSet&rowId=7&_docid=a';
                const hit = resolveHit({ data: { rowId: 7 }, id: 'anything:1', url });

                expect(hit.url).toBe(url.substring(0, url.indexOf('&_docid')));
                expect(captured.map(c => c.query)).toStrictEqual([7]);
            });

            test('a hit that is not a plate set details row does not take its data.rowId as the query', () => {
                const hit = resolveHit({ data: { rowId: 99 }, id: 'anything:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('a hit matching no branch is mapped on the url alone', () => {
                const hit = resolveHit({ data: {}, id: 'anything:1', url: UNMAPPED_DOC_ID });

                expect(hit.url).toBe(UNMAPPED);
                expect(captured.map(c => c.query)).toStrictEqual([undefined]);
            });

            test('a hit matching no branch still resolves a mappable url', () => {
                const hit = resolveHit({
                    data: {},
                    id: 'anything:1',
                    url: '/labkey/testContainer/experiment-showData.view?rowId=124&_docid=a',
                });

                expect(hit.url).toBe('#/rd/expdata/124');
            });

            test('truncation leaves a url that has no ampersand intact', () => {
                const url = '/labkey/testContainer/foo-bar.view';
                const hit = resolveHit({ data: { name: 'DCName' }, id: 'dataClass:1', url });

                expect(hit.url).toBe(url);
                expect(captured.map(c => c.url)).toStrictEqual([url]);
            });

            test('strips a doc id that truncation leaves behind', () => {
                const hit = resolveHit({
                    data: { name: 'DCName' },
                    id: 'dataClass:1',
                    url: '/labkey/testContainer/foo-bar.view?_docid=a',
                });

                expect(hit.url).toBe('/labkey/testContainer/foo-bar.view');
            });

            test('a hit with no doc id still resolves its url', () => {
                const hit = resolveHit({
                    data: { name: 'Molecule' },
                    id: 'materialSource:1',
                    url: '/labkey/testContainer/experiment-showSampleType.view?rowId=1',
                });

                expect(hit.url).toBe('#/samples/Molecule');
            });

            test('passes the whole hit to mappers as an Immutable Map', () => {
                const hit = {
                    data: { name: 'DCName', nested: { deep: true } },
                    id: 'dataClass:1',
                    url: UNMAPPED_DOC_ID,
                };
                resolveHit(hit);

                expect(captured).toHaveLength(1);
                const [args] = captured;
                expect(ImmutableMap.isMap(args.row)).toBe(true);
                expect(args.row.toJS()).toEqual(hit);
                expect(args.row.getIn(['data', 'nested', 'deep'])).toBe(true);
                expect(args.url).toBe(UNMAPPED);
            });
        });
    });

    describe('LookupMapper', () => {
        test('resolve without lookup container', () => {
            const mapper = new LookupMapper('test', undefined);
            const resolved = mapper.resolve(
                '#/list/a',
                fromJS({ value: 1 }),
                new QueryColumn({ lookup: new QueryLookup({ schemaName: 'list', queryName: 'testing' }) }),
                undefined,
                undefined
            );
            expect(resolved).toStrictEqual(AppURL.create('test', 'list', 'testing', 1));
        });

        test('resolve with lookup container same as current', () => {
            const mapper = new LookupMapper('test', undefined);
            const resolved = mapper.resolve(
                '#/list/a',
                fromJS({ value: 1 }),
                new QueryColumn({
                    lookup: new QueryLookup({
                        schemaName: 'list',
                        queryName: 'testing',
                        containerPath: LABKEY.container.path,
                    }),
                }),
                undefined,
                undefined
            );
            expect(resolved).toStrictEqual(AppURL.create('test', 'list', 'testing', 1));
        });

        test('resolve with different lookup container', () => {
            const mapper = new LookupMapper('test', undefined);
            const resolved = mapper.resolve(
                '#/list/a',
                fromJS({ value: 1 }),
                new QueryColumn({
                    lookup: new QueryLookup({ schemaName: 'list', queryName: 'testing', containerPath: '/other/path' }),
                }),
                undefined,
                undefined
            );
            expect(resolved).toBeUndefined();
        });
    });

    describe('resolveLineage', () => {
        const resolver = new URLResolver();

        const node = {
            lsid: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
            children: [
                {
                    lsid: 'urn:lsid:labkey.com:Run.Folder-252:a6e5fa05-28cd-1038-ad87-68bd1b9ac33e',
                    role: 'no role',
                },
            ],
            name: 'D-32',
            cpasType: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
            queryName: 'Source 1',
            type: 'Data',
            schemaName: 'exp.data',
            url: '/labkey/testContainer/experiment-showData.view?rowId=6648',
            parents: [],
            rowId: 6648,
        };

        test('name with spaces', () => {
            const lineageResult = LineageResult.create({
                seed: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
                nodes: {
                    'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4': node,
                },
            });
            const resolvedLinks = resolver.resolveLineageItem(
                lineageResult.nodes.get('urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4')
            );

            expect(resolvedLinks.list).toEqual('#/rd/dataclass/Source%201');
            expect(resolvedLinks.overview).toEqual('#/rd/expdata/6648');
        });

        test('url to different container', () => {
            const url = '/labkey/otherContainer/experiment-showData.view?rowId=6648';
            node['url'] = url;
            const lineageResult = LineageResult.create({
                seed: 'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4',
                nodes: {
                    'urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4': node,
                },
            });
            const resolvedLinks = resolver.resolveLineageItem(
                lineageResult.nodes.get('urn:lsid:labkey.com:Data.Folder-252:f34174d2-2678-1038-9c2a-d1b4d4df18c4')
            );

            expect(resolvedLinks.list).toEqual('#/rd/dataclass/Source%201');
            expect(resolvedLinks.overview).toEqual(url);
        });

        test('accepted types', () => {
            const lineageResult = LineageResult.create(lineageJSON);
            let resolvedLinks = resolver.resolveLineageItem(
                lineageResult.nodes.get('urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3')
            );

            // test a sample type
            expect(resolvedLinks.list).toEqual('#/samples/Hemoglobin');
            expect(resolvedLinks.overview).toEqual('#/rd/samples/6814');

            // TODO test that the run node doesn't show up
            resolvedLinks = resolver.resolveLineageItem(
                lineageResult.nodes.get('urn:lsid:labkey.com:Run.Folder-61:dbcee598-54f9-1038-9426-08c060dcd006')
            );

            expect(resolvedLinks.list).toEqual(undefined);
            expect(resolvedLinks.overview).toEqual('/labkey/testContainer/experiment-showRunGraph.view?rowId=794');

            // Issue 48836: resolve list URL via queryName if available
            // Note that the node "urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3-clone" uses
            // the new "cpasType" which does not include the name of the sample type.
            resolvedLinks = resolver.resolveLineageItem(
                lineageResult.nodes.get('urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3-clone')
            );
            expect(resolvedLinks.list).toEqual('#/samples/shemoglobin');
        });
    });

    describe('resolveSelectRows', () => {
        const resolver = new URLResolver();
        const SAMPLE_URL = '/labkey/testContainer/experiment-showMaterial.view?rowId=124';
        const LOOKUP_URL = '/labkey/testContainer/url-app?blam=2392';

        function createResponse(rows: unknown[], overrides: Record<string, unknown> = {}): any {
            return {
                formatVersion: 17.1,
                metaData: { fields: [], id: 'RowId', root: 'rows', title: 'Samples' },
                queryName: 'Samples',
                rowCount: rows.length,
                rows,
                schemaName: ['samples'],
                ...overrides,
            };
        }

        function resolve(response: any, queryInfo?: QueryInfo): any {
            return resolver.resolveSelectRows(response, queryInfo ?? new QueryInfo({}));
        }

        test('maps single-value cell urls, preserving the other cell properties', () => {
            const resolved = resolve(
                createResponse([
                    { Name: { displayValue: 'S-1 display', formattedValue: 'S-1', url: SAMPLE_URL, value: 'S-1' } },
                ])
            );

            expect(resolved.rows[0].Name).toEqual({
                displayValue: 'S-1 display',
                formattedValue: 'S-1',
                url: '#/rd/samples/124',
                value: 'S-1',
            });
        });

        test('leaves cells without a url untouched', () => {
            const resolved = resolve(
                createResponse([
                    {
                        Missing: undefined,
                        NoUrl: { displayValue: 'five', value: 5 },
                        Nulled: null,
                        Numeric: 42,
                        Primitive: 'abc',
                    },
                ])
            );

            expect(resolved.rows[0].NoUrl).toEqual({ displayValue: 'five', value: 5 });
            expect(resolved.rows[0].Nulled).toBe(null);
            expect(resolved.rows[0].Numeric).toBe(42);
            expect(resolved.rows[0].Primitive).toBe('abc');

            // undefined values are dropped by the JSON round-trip used to clone the response
            expect('Missing' in resolved.rows[0]).toBe(false);
        });

        test('maps urls within multi-value cells', () => {
            const resolved = resolve(
                createResponse([
                    {
                        Empty: [],
                        Parents: [
                            { url: SAMPLE_URL, value: 'P-1' },
                            { value: 'P-2' },
                            { url: '/labkey/testContainer/experiment-showData.view?rowId=7', value: 'D-1' },
                        ],
                        Primitives: ['a', 'b'],
                    },
                ])
            );

            expect(resolved.rows[0].Parents).toEqual([
                { url: '#/rd/samples/124', value: 'P-1' },
                { value: 'P-2' },
                { url: '#/rd/expdata/7', value: 'D-1' },
            ]);
            expect(resolved.rows[0].Primitives).toEqual(['a', 'b']);
            expect(resolved.rows[0].Empty).toEqual([]);
        });

        test('maps every row', () => {
            const resolved = resolve(
                createResponse([
                    { Name: { url: SAMPLE_URL, value: 'S-1' } },
                    { Name: { url: '/labkey/testContainer/experiment-showMaterial.view?rowId=125', value: 'S-2' } },
                ])
            );

            expect(resolved.rows.map(row => row.Name.url)).toEqual(['#/rd/samples/124', '#/rd/samples/125']);
        });

        test('preserves top-level response properties', () => {
            const messages = [{ area: 'test', content: 'hello', type: 'INFO' }];
            const response = createResponse([{ Name: { url: SAMPLE_URL, value: 'S-1' } }], { messages, rowCount: 17 });
            const resolved = resolve(response);

            expect(resolved.formatVersion).toBe(17.1);
            expect(resolved.messages).toEqual(messages);
            expect(resolved.metaData).toEqual(response.metaData);
            expect(resolved.queryName).toBe('Samples');
            expect(resolved.rowCount).toBe(17);
            expect(resolved.schemaName).toEqual(['samples']);
        });

        test('returns the response as-is when there are no rows', () => {
            const response = createResponse([]);
            expect(resolve(response)).toEqual(response);
        });

        test('does not mutate the response', () => {
            const response = createResponse([{ Name: { url: SAMPLE_URL, value: 'S-1' } }]);
            const original = JSON.parse(JSON.stringify(response));
            const resolved = resolve(response);

            expect(response).toEqual(original);
            expect(resolved.rows).not.toBe(response.rows);
            expect(resolved.rows[0]).not.toBe(response.rows[0]);
            expect(resolved.rows[0].Name).not.toBe(response.rows[0].Name);
        });

        // Production callers hand us a Query.Response instance: rows are Row instances and metaData field keys are
        // FieldKey/SchemaKey instances. The JSON round-trip is what flattens those to the plain strings the
        // field-key lookup and QueryColumn depend on.
        test('accepts a Query.Response instance', () => {
            const response = new Query.Response({
                formatVersion: 17.1,
                metaData: {
                    fields: [
                        { fieldKey: 'LookupColumn', lookup: { queryName: 'PowQuery', schemaName: 'BoomSchema' } },
                        { fieldKey: 'Name' },
                    ],
                },
                queryName: 'Samples',
                rowCount: 1,
                rows: [
                    {
                        data: {
                            LookupColumn: { displayValue: 'Lookup', url: LOOKUP_URL, value: 101 },
                            Name: { url: SAMPLE_URL, value: 'S-1' },
                        },
                        links: { details: { href: SAMPLE_URL, title: 'details' } },
                    },
                ],
                schemaName: ['samples'],
            });

            const resolved = resolve(response);

            // resolves via the metaData.fields column, which requires fieldKey to have been flattened to a string
            expect(resolved.rows[0].LookupColumn.url).toBe('#/q/BoomSchema/PowQuery/101');
            expect(resolved.rows[0].Name.url).toBe('#/rd/samples/124');
        });

        test('accepts an Immutable response', () => {
            const resolved = resolve(fromJS(createResponse([{ Name: { url: SAMPLE_URL, value: 'S-1' } }])));
            expect(resolved.rows[0].Name.url).toBe('#/rd/samples/124');
        });

        test('resolves the column from metaData.fields', () => {
            const resolved = resolve(
                createResponse([{ LookupColumn: { displayValue: 'Lookup', url: LOOKUP_URL, value: 101 } }], {
                    metaData: {
                        fields: [
                            { fieldKey: 'LookupColumn', lookup: { queryName: 'PowQuery', schemaName: 'BoomSchema' } },
                        ],
                    },
                })
            );

            expect(resolved.rows[0].LookupColumn.url).toBe('#/q/BoomSchema/PowQuery/101');
        });

        test('falls back to the queryInfo column when metaData.fields is absent', () => {
            const queryInfo = new QueryInfo({
                columns: new ExtendedMap<string, QueryColumn>({
                    lookupcolumn: new QueryColumn({
                        fieldKey: 'LookupColumn',
                        lookup: new QueryLookup({ queryName: 'QiQuery', schemaName: 'QiSchema' }),
                    }),
                }),
            });
            const response = createResponse(
                [{ LookupColumn: { displayValue: 'Lookup', url: LOOKUP_URL, value: 101 } }],
                { metaData: undefined }
            );

            expect(resolve(response, queryInfo).rows[0].LookupColumn.url).toBe('#/q/QiSchema/QiQuery/101');
        });

        test('prefers the metaData.fields column over the queryInfo column', () => {
            const queryInfo = new QueryInfo({
                columns: new ExtendedMap<string, QueryColumn>({
                    lookupcolumn: new QueryColumn({
                        fieldKey: 'LookupColumn',
                        lookup: new QueryLookup({ queryName: 'QiQuery', schemaName: 'QiSchema' }),
                    }),
                }),
            });
            const response = createResponse(
                [{ LookupColumn: { displayValue: 'Lookup', url: LOOKUP_URL, value: 101 } }],
                {
                    metaData: {
                        fields: [
                            { fieldKey: 'LookupColumn', lookup: { queryName: 'MetaQuery', schemaName: 'MetaSchema' } },
                        ],
                    },
                }
            );

            expect(resolve(response, queryInfo).rows[0].LookupColumn.url).toBe('#/q/MetaSchema/MetaQuery/101');
        });

        test('passes the schemaName to mappers as a dot-delimited string', () => {
            const resolved = resolve(
                createResponse(
                    [
                        {
                            Batch: {
                                url: '/labkey/testContainer/assay-assayRuns.view?rowId=636&Runs.Batch%2FRowId~eq=6169',
                                value: 6169,
                            },
                        },
                    ],
                    { queryName: 'Runs', schemaName: ['assay', 'General', 'testProtocol'] }
                )
            );

            expect(resolved.rows[0].Batch.url).toBe('#/assays/General/testProtocol/batches/6169');
        });

        test('does not remap urls from an unrelated container', () => {
            const url = '/labkey/otherContainer/experiment-showMaterial.view?rowId=124';
            expect(resolve(createResponse([{ Name: { url, value: 'S-1' } }])).rows[0].Name.url).toBe(url);
        });

        test('leaves the url as-is when no mapper resolves it', () => {
            const url = '/labkey/testContainer/foo-bar.view?x=1';
            expect(resolve(createResponse([{ Name: { url, value: 'S-1' } }])).rows[0].Name.url).toBe(url);
        });

        describe('mapper arguments', () => {
            interface Captured {
                column: QueryColumn;
                queryName: string;
                row: ImmutableMap<string, unknown>;
                schemaName: string;
                url: string;
            }

            const captured: Captured[] = [];

            beforeAll(() => {
                // Registered after the default mappers and always returns undefined, so it records without
                // affecting resolution. Mapper resolution is lazy, so it only sees urls no default mapper resolves.
                URLService.registerURLMappers({
                    resolve: (url, row, column, schemaName, queryName) => {
                        captured.push({ column, queryName, row, schemaName, url });
                        return undefined;
                    },
                });
            });

            beforeEach(() => {
                captured.length = 0;
            });

            test('passes the cell as an Immutable Map along with the column, schema, and query', () => {
                const url = '/labkey/testContainer/foo-bar.view?x=1';
                const cell = { displayValue: 'Batch display', url, value: 6169 };

                resolve(
                    createResponse([{ Batch: cell }], {
                        metaData: { fields: [{ caption: 'Batch', fieldKey: 'Batch' }] },
                        queryName: 'Runs',
                        schemaName: ['assay', 'General', 'My.Protocol'],
                    })
                );

                expect(captured).toHaveLength(1);
                const [args] = captured;
                expect(args.url).toBe(url);
                expect(ImmutableMap.isMap(args.row)).toBe(true);
                expect(args.row.toJS()).toEqual(cell);
                expect(args.column).toBeInstanceOf(QueryColumn);
                expect(args.column.fieldKey).toBe('Batch');
                expect(args.column.caption).toBe('Batch');
                expect(args.schemaName).toBe('assay.General.My.Protocol');
                expect(args.queryName).toBe('Runs');
            });

            test('passes each entry of a multi-value cell as an Immutable Map', () => {
                const url = '/labkey/testContainer/foo-bar.view?x=1';
                const cells = [
                    { displayValue: 'P-1', url, value: 1 },
                    { displayValue: 'P-2', url, value: 2 },
                ];

                resolve(createResponse([{ Parents: cells }]));

                expect(captured).toHaveLength(2);
                expect(captured.map(args => ImmutableMap.isMap(args.row))).toEqual([true, true]);
                expect(captured.map(args => args.row.toJS())).toEqual(cells);
                expect(captured.map(args => args.column)).toEqual([undefined, undefined]);
                expect(captured.map(args => args.schemaName)).toEqual(['samples', 'samples']);
            });
        });
    });
});
