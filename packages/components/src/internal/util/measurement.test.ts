import {
    areUnitsCompatible,
    getAltUnitKeys,
    getMetricUnitOptions,
    isValuePrecisionValid,
    UnitModel
} from './measurement';

describe('UnitModel', () => {
    test('constructor and operators', () => {
        expect(new UnitModel(10, null).toString()).toBe('10');
        expect(new UnitModel(10, 'mL').toString()).toBe('10 mL');

        expect(new UnitModel(99999, 'uL').as('L').toString()).toBe('0.099999 L');
        expect(new UnitModel(99999.133, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'mg').as('kg').toString()).toBe('0.099999133457 kg');
        expect(new UnitModel(10, 'mL').as('L').toString()).toBe('0.01 L');
        expect(new UnitModel(10, 'mL').add(10, 'uL').toString()).toBe('10.01 mL');
        expect(new UnitModel(undefined, 'mL').as('L').toString()).toBe('undefined L');

        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'mL')) > 0).toBeTruthy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
    });
});

describe('MetricUnit utils', () => {
    test('getMetricUnitOptions', () => {
        const expectedMetricUnitOptions = [
            { label: 'unit', value: 'unit' },
            { label: 'g (grams)', value: 'g' },
            { label: 'kg (kilograms)', value: 'kg' },
            { label: 'mg (milligrams)', value: 'mg' },
            { label: 'mL (milliliters)', value: 'mL' },
            { label: 'uL (microliters)', value: 'uL' },
            { label: 'L (liters)', value: 'L' },
        ];

        const options = getMetricUnitOptions(undefined, true).sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(options).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedMetricUnitOptions[0]),
                expect.objectContaining(expectedMetricUnitOptions[1]),
                expect.objectContaining(expectedMetricUnitOptions[2]),
                expect.objectContaining(expectedMetricUnitOptions[3]),
                expect.objectContaining(expectedMetricUnitOptions[4]),
                expect.objectContaining(expectedMetricUnitOptions[5]),
                expect.objectContaining(expectedMetricUnitOptions[6]),
            ])
        );
    });

    test('getMetricUnitOptions with unit', () => {
        const expectedUlOptions = [
            { label: 'L', value: 'L' },
            { label: 'mL', value: 'mL' },
            { label: 'uL', value: 'uL' },
        ];
        const ulOptions = getMetricUnitOptions('uL').sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(ulOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedUlOptions[0]),
                expect.objectContaining(expectedUlOptions[1]),
                expect.objectContaining(expectedUlOptions[2]),
            ])
        );

        const expectedUlLongLabelOptions = [
            { label: 'L (liters)', value: 'L' },
            { label: 'mL (milliliters)', value: 'mL' },
            { label: 'uL (microliters)', value: 'uL' },
        ];
        const ulLongLabelOptions = getMetricUnitOptions('uL', true).sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(ulLongLabelOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedUlLongLabelOptions[0]),
                expect.objectContaining(expectedUlLongLabelOptions[1]),
                expect.objectContaining(expectedUlLongLabelOptions[2]),
            ])
        );

        const expectedKgOptions = [
            { label: 'g', value: 'g' },
            { label: 'kg', value: 'kg' },
            { label: 'mg', value: 'mg' },
        ];
        const kgOptions = getMetricUnitOptions('kg').sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(kgOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedKgOptions[0]),
                expect.objectContaining(expectedKgOptions[1]),
                expect.objectContaining(expectedKgOptions[2]),
            ])
        );

        expect(getMetricUnitOptions(null).length).toBe(7);
        expect(getMetricUnitOptions('').length).toBe(7);
        expect(getMetricUnitOptions('bad').length).toBe(7);
    });

    test('getAltUnitKeys', () => {
        const expectedUlOptions = ['mL', 'uL', 'L'];
        expect(getAltUnitKeys('uL')).toEqual(expectedUlOptions);
        expect(getAltUnitKeys('mL')).toEqual(expectedUlOptions);

        const expectedGOptions = ['g', 'mg', 'kg'];
        expect(getAltUnitKeys('g')).toEqual(expectedGOptions);
        expect(getAltUnitKeys('kg')).toEqual(expectedGOptions);

        expect(getAltUnitKeys('unit')).toEqual(['unit']);

        // include all options when no unitTypeStr or an invalid unitTypeStr is provided
        expect(getAltUnitKeys(null).length).toBe(7);
        expect(getAltUnitKeys('').length).toBe(7);
        expect(getAltUnitKeys('bad').length).toBe(7);
    });
});

describe('isValuePrecisionValid', () => {
    test('value prop missing', () => {
        expect(isValuePrecisionValid(undefined, 0)).toBeTruthy();
        expect(isValuePrecisionValid(null, 0)).toBeTruthy();
    });

    test('value prop negative', () => {
        expect(isValuePrecisionValid(-1, 0)).toBeFalsy();
        expect(isValuePrecisionValid(-0.000000001, 0)).toBeFalsy();
    });

    test('precision prop', () => {
        expect(isValuePrecisionValid(1, 0)).toBeTruthy();
        expect(isValuePrecisionValid(1.0, 0)).toBeTruthy();
        expect(isValuePrecisionValid(1.1, 0)).toBeFalsy();

        expect(isValuePrecisionValid(0.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.0000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.0000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.0000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.0000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.100001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.100001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.1000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.1000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.9999991, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.9999999, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.9999991, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.9999999, 6)).toBeFalsy();
    });
});

describe('areUnitsCompatible', () => {
    test('true because of equal or empty', () => {
        expect(areUnitsCompatible(undefined, undefined)).toBeTruthy();
        expect(areUnitsCompatible(null, null)).toBeTruthy();
        expect(areUnitsCompatible('', '')).toBeTruthy();
        expect(areUnitsCompatible('mL', 'mL')).toBeTruthy();
        expect(areUnitsCompatible('bogus', 'bogus')).toBeTruthy();
        expect(areUnitsCompatible('unit', 'unit')).toBeTruthy();
    });

    test('true because of compatible kind', () => {
        expect(areUnitsCompatible('mL', 'uL')).toBeTruthy();
        expect(areUnitsCompatible('mL', 'L')).toBeTruthy();
        expect(areUnitsCompatible('uL', 'L')).toBeTruthy();
        expect(areUnitsCompatible('uL', 'mL')).toBeTruthy();
        expect(areUnitsCompatible('kg', 'g')).toBeTruthy();
        expect(areUnitsCompatible('kg', 'mg')).toBeTruthy();
        expect(areUnitsCompatible('mg', 'g')).toBeTruthy();
        expect(areUnitsCompatible('mg', 'kg')).toBeTruthy();
    });

    test('false because of one empty', () => {
        expect(areUnitsCompatible(undefined, 'mL')).toBeFalsy();
        expect(areUnitsCompatible(null, 'mL')).toBeFalsy();
        expect(areUnitsCompatible('', 'mL')).toBeFalsy();
        expect(areUnitsCompatible('kg', undefined)).toBeFalsy();
        expect(areUnitsCompatible('kg', null)).toBeFalsy();
        expect(areUnitsCompatible('kg', '')).toBeFalsy();
    });

    test('false because of incompatible kind', () => {
        expect(areUnitsCompatible('mL', 'kg')).toBeFalsy();
        expect(areUnitsCompatible('mL', 'mg')).toBeFalsy();
        expect(areUnitsCompatible('mL', 'g')).toBeFalsy();
        expect(areUnitsCompatible('mL', 'unit')).toBeFalsy();
        expect(areUnitsCompatible('uL', 'kg')).toBeFalsy();
        expect(areUnitsCompatible('uL', 'mg')).toBeFalsy();
        expect(areUnitsCompatible('uL', 'g')).toBeFalsy();
        expect(areUnitsCompatible('uL', 'unit')).toBeFalsy();
        expect(areUnitsCompatible('kg', 'mL')).toBeFalsy();
        expect(areUnitsCompatible('kg', 'uL')).toBeFalsy();
        expect(areUnitsCompatible('kg', 'L')).toBeFalsy();
        expect(areUnitsCompatible('kg', 'unit')).toBeFalsy();
    });

    test('false because of bogus unit', () => {
        expect(areUnitsCompatible('bogus', 'mL')).toBeFalsy();
        expect(areUnitsCompatible('bogus', 'kg')).toBeFalsy();
        expect(areUnitsCompatible('mL', 'bogus')).toBeFalsy();
        expect(areUnitsCompatible('kg', 'bogus')).toBeFalsy();
    });
});
