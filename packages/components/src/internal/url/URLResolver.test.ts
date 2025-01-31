import { fromJS } from 'immutable';

import entitiesJSON from '../../test/data/sampleSetSearchResult.json';
import lineageJSON from '../../test/data/experiment-lineage.json';
import { LineageResult } from '../components/lineage/models';

import { registerDefaultURLMappers } from '../test/testHelpers';

import { QueryColumn, QueryLookup } from '../../public/QueryColumn';

import { SearchCategory } from '../components/search/constants';
import { SearchHit, SearchResult } from '../components/search/actions';
import { TEST_PROJECT_CONTAINER } from '../containerFixtures';

import { AppURL } from './AppURL';
import { LookupMapper, URLResolver } from './URLResolver';

beforeAll(() => {
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };

    registerDefaultURLMappers();
});

describe('URLResolver', () => {
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

        test('resolve Sample Set url', () => {
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
});
