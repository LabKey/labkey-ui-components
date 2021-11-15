import { convertPicklistSampleTypeData } from './actions';

describe('convertPicklistSampleTypeData', () => {
    test('without sample types', () => {
        const response = convertPicklistSampleTypeData([]);
        expect(Object.keys(response).length).toBe(0);
    });

    test('with sample types', () => {
        const response = convertPicklistSampleTypeData([
            { SampleType: { displayValue: 'test1' }, SampleIds: [{ value: '' }] },
            { SampleType: { displayValue: 'test2' }, SampleIds: [{ value: '1' }] },
            { SampleType: { displayValue: 'test3' }, SampleIds: [{ value: '2,3' }] },
        ]);
        expect(Object.keys(response).length).toBe(3);
        expect(response['test1']).toStrictEqual(['']);
        expect(response['test2']).toStrictEqual(['1']);
        expect(response['test3']).toStrictEqual(['2', '3']);
    });
});
