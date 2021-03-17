import { getProcessedSearchHits, getSearchResultCardData } from './actions';

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
            iconSrc: 'default',
            typeName: undefined,
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
            iconSrc: 'samples',
            typeName: 'MixtureBatches',
        });
    });

    test('sample icon', () => {
        const data = {};

        const resultCardData = getSearchResultCardData(data, 'material', undefined);
        expect(resultCardData).toStrictEqual({
            title: undefined,
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
            category: 'file workflowJob',
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
        expect(filteredHits).toHaveLength(5);
        expect(filteredHits[0].title).toBe(SEARCH_RESULTS[0].title);
        expect(filteredHits[1].title).toBe(SEARCH_RESULTS[1].title);
        expect(filteredHits[2].title).toBe(SEARCH_RESULTS[2].title);
        expect(filteredHits[3].title).toBe(SEARCH_RESULTS[3].title);
        expect(filteredHits[4].title).toBe(SEARCH_RESULTS[5].title);
    });

    test('custom category filters', () => {
        let filteredHits = getProcessedSearchHits(SEARCH_RESULTS, undefined, ['other']);
        expect(filteredHits).toHaveLength(2);
        expect(filteredHits[0].title).toBe(SEARCH_RESULTS[4].title);
        expect(filteredHits[1].title).toBe(SEARCH_RESULTS[5].title);

        filteredHits = getProcessedSearchHits(SEARCH_RESULTS, undefined, []);
        expect(filteredHits).toHaveLength(1);
        expect(filteredHits[0].title).toBe(SEARCH_RESULTS[5].title);
    });
});
