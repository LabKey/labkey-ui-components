import { fromJS } from 'immutable';

import { getSearchResultCardData } from './actions';

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
