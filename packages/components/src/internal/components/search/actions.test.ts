import { Ajax } from '@labkey/api';

import {
    getProcessedSearchHits,
    getSearchResultCardData,
    resolveIconSrc,
    resolveTypeName,
    resolveIconDir,
    search,
    SearchOptions,
} from './actions';
import { SearchCategory, SearchScope } from './constants';

describe('search actions', () => {
    describe('getSearchResultCardData', () => {
        test('data class object', () => {
            const data = {
                dataClass: {
                    name: 'Test Source',
                    category: 'sources',
                    type: 'dataClass',
                },
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.DataClass, 'my title');
            expect(resultCardData).toStrictEqual({
                title: 'my title',
                iconDir: undefined,
                iconSrc: 'test source',
                typeName: 'Test Source',
            });
        });

        test('sample set sample', () => {
            const data = {
                sampleSet: {
                    name: 'Test Sample Set',
                    type: 'sampleSet',
                },
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.Material, undefined);
            expect(resultCardData).toStrictEqual({
                title: undefined,
                iconDir: undefined,
                iconSrc: 'samples',
                typeName: 'Test Sample Set',
            });
        });

        test('data class', () => {
            const data = {
                name: 'Test Source',
                type: 'dataClass',
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.DataClass, 'my title');
            expect(resultCardData).toStrictEqual({
                title: 'my title',
                iconDir: undefined,
                iconSrc: undefined,
                typeName: undefined,
            });

            const sourceData = {
                dataClass: {
                    category: 'source',
                    name: 'mice',
                },
            };

            const sourceCardData = getSearchResultCardData(sourceData, SearchCategory.DataClass, 'bruno');
            expect(sourceCardData).toStrictEqual({
                title: 'bruno',
                iconDir: undefined,
                iconSrc: 'mice',
                typeName: 'mice',
            });
        });

        test('sample set', () => {
            const data = {
                name: 'Test SampleSet',
                type: 'sampleSet',
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.MaterialSource, undefined);
            expect(resultCardData).toStrictEqual({
                title: undefined,
                iconDir: undefined,
                iconSrc: 'sample_set',
                typeName: undefined,
            });
        });

        test('ingredients icon', () => {
            const data = {
                sampleSet: {
                    name: 'RawMaterials',
                    type: 'sampleSet',
                },
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.Material, undefined);
            expect(resultCardData).toStrictEqual({
                title: undefined,
                iconDir: undefined,
                iconSrc: 'samples',
                typeName: 'RawMaterials',
            });
        });

        test('batch icon', () => {
            const data = {
                sampleSet: {
                    name: 'MixtureBatches',
                    type: 'sampleSet',
                },
            };

            const resultCardData = getSearchResultCardData(data, SearchCategory.Material, undefined);
            expect(resultCardData).toStrictEqual({
                title: undefined,
                iconDir: undefined,
                iconSrc: 'samples',
                typeName: 'MixtureBatches',
            });
        });

        test('sample icon', () => {
            const data = {};

            const resultCardData = getSearchResultCardData(data, SearchCategory.Material, undefined);
            expect(resultCardData).toStrictEqual({
                title: undefined,
                iconDir: undefined,
                iconSrc: 'samples',
                typeName: undefined,
            });
        });
    });

    describe('getProcessedSearchHits', () => {
        const SEARCH_RESULTS = [
            {
                id: 'a:1',
                title: 'Test data',
                category: SearchCategory.Data,
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
            },
            {
                id: 'a:2',
                title: 'Test material',
                category: SearchCategory.Material,
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
            },
            {
                id: 'a:3',
                title: 'Test workflowJob',
                category: SearchCategory.WorkflowJob,
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
            },
            {
                id: 'a:4',
                title: 'Test file workflowJob',
                category: SearchCategory.FileWorkflowJob,
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
            },
            {
                id: 'a:5',
                title: 'Test other',
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
            },
            {
                id: 'a:6',
                title: 'Test has data',
                container: 'abc61d95-73d3-103b-845e-877a77afc840',
                data: { test: 123 },
            },
        ];

        test('default category filters', () => {
            const filteredHits = getProcessedSearchHits(SEARCH_RESULTS);
            expect(filteredHits).toHaveLength(6);
            expect(filteredHits[0].title).toBe(SEARCH_RESULTS[0].title);
            expect(filteredHits[1].title).toBe(SEARCH_RESULTS[1].title);
            expect(filteredHits[2].title).toBe(SEARCH_RESULTS[2].title);
            expect(filteredHits[3].title).toBe(SEARCH_RESULTS[3].title);
            expect(filteredHits[4].title).toBe(SEARCH_RESULTS[4].title);
            expect(filteredHits[5].title).toBe(SEARCH_RESULTS[5].title);
        });
    });

    describe('resolveTypeName', () => {
        test('data undefined', () => {
            expect(resolveTypeName(undefined, undefined)).toBeUndefined();
            expect(resolveTypeName(undefined, null)).toBeUndefined();
            expect(resolveTypeName(undefined, 'invalid' as SearchCategory)).toBeUndefined();
            expect(resolveTypeName(undefined, SearchCategory.Notebook)).toBe('Notebook');
            expect(resolveTypeName(undefined, SearchCategory.NotebookTemplate)).toBe('Notebook Template');
        });

        test('data defined', () => {
            expect(resolveTypeName({}, undefined)).toBeUndefined();
            expect(resolveTypeName({ dataClass: { name: undefined } }, undefined)).toBeUndefined();
            expect(resolveTypeName({ dataClass: { name: 'testDataClass' } }, undefined)).toBe('testDataClass');
            expect(resolveTypeName({ sampleSet: { name: undefined } }, undefined)).toBeUndefined();
            expect(resolveTypeName({ sampleSet: { name: 'testSampleSet' } }, undefined)).toBe('testSampleSet');
            expect(resolveTypeName({ sampleSet: { name: 'testSampleSet' } }, SearchCategory.Notebook)).toBe(
                'testSampleSet'
            );
            expect(resolveTypeName({ sampleSet: { name: undefined } }, SearchCategory.Notebook)).toBe('Notebook');
        });
    });

    describe('resolveIconSrc', () => {
        test('data undefined', () => {
            expect(resolveIconSrc(undefined, undefined)).toBeUndefined();
            expect(resolveIconSrc(undefined, 'invalid' as SearchCategory)).toBeUndefined();
            expect(resolveIconSrc(undefined, SearchCategory.Material)).toBe('samples');
            expect(resolveIconSrc(undefined, SearchCategory.WorkflowJob)).toBe('workflow');
            expect(resolveIconSrc(undefined, SearchCategory.Notebook)).toBe('notebook_blue');
            expect(resolveIconSrc(undefined, SearchCategory.NotebookTemplate)).toBe('notebook_blue');
        });

        test('data defined', () => {
            expect(resolveIconSrc({}, undefined)).toBeUndefined();
            expect(resolveIconSrc({ dataClass: { name: undefined } }, undefined)).toBeUndefined();
            expect(resolveIconSrc({ dataClass: { name: 'testDataClass' } }, undefined)).toBeUndefined();
            expect(resolveIconSrc({ dataClass: { category: 'test', name: 'testDataClass' } }, undefined)).toBe(
                'testdataclass'
            );
            expect(resolveIconSrc({ sampleSet: { name: undefined } }, undefined)).toBeUndefined();
            expect(resolveIconSrc({ sampleSet: { name: 'testSampleSet' } }, undefined)).toBe('samples');
            expect(resolveIconSrc({ type: undefined }, undefined)).toBeUndefined();
            expect(resolveIconSrc({ type: 'sampleSet' }, undefined)).toBe('sample_set');
            expect(resolveIconSrc({ type: 'dataClassTest' }, undefined)).toBe(undefined);
            expect(resolveIconSrc({ type: 'test' }, undefined)).toBe('test');
        });
    });

    describe('resolveIconDir', () => {
        test('category', () => {
            expect(resolveIconDir(undefined)).toBeUndefined();
            expect(resolveIconDir('invalid' as SearchCategory)).toBeUndefined();
            expect(resolveIconDir(SearchCategory.Notebook)).toBe('labbook/images');
            expect(resolveIconDir(SearchCategory.NotebookTemplate)).toBe('labbook/images');
        });
    });

    describe('search', () => {
        const mockSearchRequest = jest.fn((config: Ajax.RequestOptions) => {
            const req = new XMLHttpRequest();
            (req as any).responseJSON = {
                hits: [],
                metaData: {},
                q: config.params.q,
                totalCount: 0,
            };
            config.success(req, config);
            return req;
        });

        test('default options', async () => {
            const query = 'Ken Griffey Jr.';

            await search({ q: query }, undefined, undefined, mockSearchRequest);

            expect(mockSearchRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: {
                        experimentalCustomJson: true,
                        normalizeUrls: true,
                        q: query,
                        scope: SearchScope.FolderAndSubfolders,
                    },
                })
            );
        });

        test('param configuration', async () => {
            const customOptions: SearchOptions = {
                experimentalCustomJson: false,
                normalizeUrls: false,
                q: 'Edgar Martinez',
                scope: SearchScope.All,
            };

            await search(customOptions, undefined, undefined, mockSearchRequest);

            expect(mockSearchRequest).toHaveBeenCalledWith(expect.objectContaining({ params: customOptions }));
        });

        test('category configuration', async () => {
            // Single category
            await search(
                { category: SearchCategory.AssayRun, q: 'Miguel Olivo' },
                undefined,
                undefined,
                mockSearchRequest
            );
            expect(mockSearchRequest).toHaveBeenCalledWith(
                expect.objectContaining({ params: expect.objectContaining({ category: SearchCategory.AssayRun }) })
            );

            // Single category array
            await search(
                { category: [SearchCategory.Assay], q: 'John Olerud' },
                undefined,
                undefined,
                mockSearchRequest
            );
            expect(mockSearchRequest).toHaveBeenCalledWith(
                expect.objectContaining({ params: expect.objectContaining({ category: SearchCategory.Assay }) })
            );

            // Multiple categories
            const categories = [SearchCategory.Assay, SearchCategory.AssayBatch, SearchCategory.AssayRun];
            const expectedCategories = categories.join('+');
            await search({ category: categories, q: 'Dan Wilson' }, undefined, undefined, mockSearchRequest);
            expect(mockSearchRequest).toHaveBeenCalledWith(
                expect.objectContaining({ params: expect.objectContaining({ category: expectedCategories }) })
            );
        });
    });
});
