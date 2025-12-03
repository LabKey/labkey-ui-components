import {
    areUnitsCompatible,
    getAltUnitKeys,
    getMeasurementUnit,
    getMetricUnitOptions,
    MEASUREMENT_UNITS,
    UnitModel,
} from './measurement';

describe('UnitModel', () => {
    test('constructor and operators', () => {
        expect(new UnitModel(10, null).toString()).toBe('10');
        expect(new UnitModel(10, 'mL').toString()).toBe('10 mL');

        expect(new UnitModel(99999, 'uL').as('L').toString()).toBe('0.099999 L');
        expect(new UnitModel(99999.133, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'mg').as('kg').toString()).toBe('0.09999913345678 kg');
        expect(new UnitModel(10, 'mL').as('L').toString()).toBe('0.01 L');
        expect(new UnitModel(undefined, 'mL').as('L').toString()).toBe('undefined L');
        expect(new UnitModel(0.0005, 'mL').as('mL').toString()).toBe('0.0005 mL');
        expect(new UnitModel(0.0005, 'uL').as('mL').toString()).toBe('0.000001 mL');
        expect(new UnitModel(0.0005, 'L').as('mL').toString()).toBe('0.5 mL');

        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'mL')) > 0).toBeTruthy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
    });

    test('isSupportedUnitType', () => {
        expect(new UnitModel(10, null).isSupportedUnitType()).toBeFalsy();
        expect(new UnitModel(10, 'mL').isSupportedUnitType()).toBeTruthy();
        expect(new UnitModel(10, 'bad').isSupportedUnitType()).toBeFalsy();
    });

    test('canConvert', () => {
        expect(new UnitModel(10, null).canConvert(null)).toBeTruthy();
        expect(new UnitModel(10, null).canConvert('mL')).toBeFalsy();
        expect(new UnitModel(10, 'mL').canConvert('mL')).toBeTruthy();
        expect(new UnitModel(10, 'mL').canConvert('uL')).toBeTruthy();
        expect(new UnitModel(10, 'mL').canConvert('kg')).toBeFalsy();
        expect(new UnitModel(10, 'bad').canConvert('mL')).toBeFalsy();
    });

    test('isValidForSubmit', () => {
        expect(new UnitModel(undefined, null).isValidForSubmit()).toBeTruthy();
        expect(new UnitModel(null, null).isValidForSubmit()).toBeTruthy();
        expect(new UnitModel(null, 'bad').isValidForSubmit()).toBeTruthy();
        expect(new UnitModel(null, 'mL').isValidForSubmit()).toBeFalsy();
        expect(new UnitModel(0, null).isValidForSubmit()).toBeFalsy();
        expect(new UnitModel(0, null).isValidForSubmit()).toBeFalsy();
        expect(new UnitModel(0, 'bad').isValidForSubmit()).toBeFalsy();
        expect(new UnitModel(0, 'mL').isValidForSubmit()).toBeTruthy();
        expect(new UnitModel(1, 'uL').isValidForSubmit()).toBeTruthy();
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

        expect(getMetricUnitOptions(null).length).toBe(10);
        expect(getMetricUnitOptions('').length).toBe(10);
        expect(getMetricUnitOptions('bad').length).toBe(10);
    });

    test('getAltUnitKeys', () => {
        const expectedUlOptions = ['mL', 'uL', 'L'];
        expect(getAltUnitKeys('uL')).toEqual(expectedUlOptions);
        expect(getAltUnitKeys('mL')).toEqual(expectedUlOptions);

        const expectedGOptions = ['g', 'mg', 'kg', 'ug', 'ng'];
        expect(getAltUnitKeys('g')).toEqual(expectedGOptions);
        expect(getAltUnitKeys('kg')).toEqual(expectedGOptions);

        expect(getAltUnitKeys('unit')).toEqual([
            'unit',
            'blocks',
            'bottle',
            'box',
            'cells',
            'kit',
            'pack',
            'pcs',
            'slides',
            'tests',
        ]);

        // include all options when no unitTypeStr or an invalid unitTypeStr is provided
        expect(getAltUnitKeys(null).length).toBe(19);
        expect(getAltUnitKeys('').length).toBe(19);
        expect(getAltUnitKeys('bad').length).toBe(19);
    });

    test('getMeasurementUnit', () => {
        expect(getMeasurementUnit(undefined)).toBeNull();
        expect(getMeasurementUnit('')).toBeNull();
        expect(getMeasurementUnit('invalidUnit')).toBeNull();
        expect(getMeasurementUnit('mL')).toEqual(MEASUREMENT_UNITS.ml);
        expect(getMeasurementUnit('ML')).toEqual(MEASUREMENT_UNITS.ml);
        const unit = getMeasurementUnit('pcs');
        expect(unit).toEqual({
            ...MEASUREMENT_UNITS.unit,
            label: 'pcs',
            longLabelSingular: 'pcs',
            longLabelPlural: 'pcs',
        });
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
