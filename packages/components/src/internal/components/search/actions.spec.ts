import {
    getProcessedSearchHits,
    getSearchResultCardData,
    resolveIconSrc,
    resolveTypeName,
    resolveIconDir,
} from './actions';

describe('getSearchResultCardData', () => {
    test('data class object', () => {
        const data = {
            dataClass: {
                name: 'Test Source',
                category: 'sources',
                type: 'dataClass',
            },
        };

        const resultCardData = getSearchResultCardData(data, 'dataClass', 'my title');
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

        const resultCardData = getSearchResultCardData(data, 'material', undefined);
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

        const resultCardData = getSearchResultCardData(data, 'dataClass', 'my title');
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

        const sourceCardData = getSearchResultCardData(sourceData, 'dataClass', 'bruno');
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

        const resultCardData = getSearchResultCardData(data, 'materialSource', undefined);
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

        const resultCardData = getSearchResultCardData(data, 'material', undefined);
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

        const resultCardData = getSearchResultCardData(data, 'material', undefined);
        expect(resultCardData).toStrictEqual({
            title: undefined,
            iconDir: undefined,
            iconSrc: 'samples',
            typeName: 'MixtureBatches',
        });
    });

    test('sample icon', () => {
        const data = {};

        const resultCardData = getSearchResultCardData(data, 'material', undefined);
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
            id: 1,
            title: 'Test data',
            category: 'data',
        },
        {
            id: 2,
            title: 'Test material',
            category: 'material',
        },
        {
            id: 3,
            title: 'Test workflowJob',
            category: 'workflowJob',
        },
        {
            id: 4,
            title: 'Test file workflowJob',
            category: 'fileWorkflowJob',
        },
        {
            id: 5,
            title: 'Test other',
            category: 'other',
        },
        {
            id: 6,
            title: 'Test has data',
            category: 'always included',
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
        expect(resolveTypeName(undefined, 'test')).toBeUndefined();
        expect(resolveTypeName(undefined, 'notebook')).toBe('Notebook');
        expect(resolveTypeName(undefined, 'notebookTemplate')).toBe('Notebook Template');
    });

    test('data defined', () => {
        expect(resolveTypeName({}, undefined)).toBeUndefined();
        expect(resolveTypeName({ dataClass: { name: undefined } }, undefined)).toBeUndefined();
        expect(resolveTypeName({ dataClass: { name: 'testDataClass' } }, undefined)).toBe('testDataClass');
        expect(resolveTypeName({ sampleSet: { name: undefined } }, undefined)).toBeUndefined();
        expect(resolveTypeName({ sampleSet: { name: 'testSampleSet' } }, undefined)).toBe('testSampleSet');
        expect(resolveTypeName({ sampleSet: { name: 'testSampleSet' } }, 'notebook')).toBe('testSampleSet');
        expect(resolveTypeName({ sampleSet: { name: undefined } }, 'notebook')).toBe('Notebook');
    });
});

describe('resolveIconSrc', () => {
    test('data undefined', () => {
        expect(resolveIconSrc(undefined, undefined)).toBeUndefined();
        expect(resolveIconSrc(undefined, 'test')).toBeUndefined();
        expect(resolveIconSrc(undefined, 'material')).toBe('samples');
        expect(resolveIconSrc(undefined, 'workflowJob')).toBe('workflow');
        expect(resolveIconSrc(undefined, 'notebook')).toBe('notebook_blue');
        expect(resolveIconSrc(undefined, 'notebookTemplate')).toBe('notebook_blue');
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
        expect(resolveIconDir('test')).toBeUndefined();
        expect(resolveIconDir('notebook')).toBe('labbook/images');
        expect(resolveIconDir('notebookTemplate')).toBe('labbook/images');
    });
});
