import { getProjectDataTypeDataCountSql } from './actions';

describe('getProjectDataTypeDataCountSql', () => {
    test('null', () => {
        expect(getProjectDataTypeDataCountSql(null)).toBeNull();
    });

    test('SampleType', () => {
        expect(getProjectDataTypeDataCountSql('SampleType')).toBe(
            'SELECT SampleSet as Type, COUNT(*) as DataCount FROM exp.materials GROUP BY SampleSet'
        );
    });

    test('DataClass', () => {
        expect(getProjectDataTypeDataCountSql('DataClass')).toBe(
            'SELECT dataclass as Type, COUNT(*) as DataCount FROM exp.data WHERE DataClass IS NOT NULL GROUP BY dataclass'
        );
    });

    test('AssayDesign', () => {
        expect(getProjectDataTypeDataCountSql('AssayDesign')).toBe(
            'SELECT protocol as Type, COUNT(*) as DataCount FROM exp.AssayRuns GROUP BY protocol'
        );
    });
});
