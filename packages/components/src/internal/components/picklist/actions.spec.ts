import { convertPicklistSampleTypeData } from './actions';

describe('convertPicklistSampleTypeData', () => {
    test('without sample types', () => {
        const response = convertPicklistSampleTypeData([]);
        expect(Object.keys(response).length).toBe(0);
    });

    test('with sample types', () => {
        const response = convertPicklistSampleTypeData([
            { SampleType: { displayValue: 'test1' } },
            { SampleType: { displayValue: 'test2' } },
            { SampleType: { displayValue: 'test3' } },
        ]);
        expect(Object.keys(response).length).toBe(3);
        expect(response[0]).toBe('test1');
        expect(response[1]).toBe('test2');
        expect(response[2]).toBe('test3');
    });
});
