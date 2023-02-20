import { BASE_UNITS, MeasurementUnit } from './models';

export const MEASUREMENT_UNITS: { [key: string]: MeasurementUnit } = {
    g: {
        label: 'g',
        longLabelSingular: 'gram',
        longLabelPlural: 'grams',
        baseUnit: BASE_UNITS.MASS,
        ratio: 1,
        displayPrecision: 3, // enable smallest precision of mg
    },
    mg: {
        label: 'mg',
        longLabelSingular: 'milligram',
        longLabelPlural: 'milligrams',
        baseUnit: BASE_UNITS.MASS,
        ratio: 0.001,
        displayPrecision: 0,
    },
    kg: {
        label: 'kg',
        longLabelSingular: 'kilogram',
        longLabelPlural: 'kilograms',
        baseUnit: BASE_UNITS.MASS,
        ratio: 1000,
        displayPrecision: 6, // enable smallest precision of mg
    },
    ml: {
        label: 'mL',
        longLabelSingular: 'milliliter',
        longLabelPlural: 'milliliters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 1,
        displayPrecision: 3,
    },
    ul: {
        label: 'uL',
        longLabelSingular: 'microliter',
        longLabelPlural: 'microliters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 0.001,
        displayPrecision: 0,
    },
    l: {
        label: 'L',
        longLabelSingular: 'liter',
        longLabelPlural: 'liters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 1000,
        displayPrecision: 6,
    },
    unit: {
        label: 'unit',
        longLabelSingular: 'unit',
        longLabelPlural: 'unit',
        baseUnit: BASE_UNITS.COUNT,
        ratio: 1,
        displayPrecision: 2,
    },
};

/**
 * @param unitAStr
 * @param unitBStr
 */
export function areUnitsCompatible(unitAStr: string, unitBStr: string) {
    if (unitAStr == unitBStr) return true;
    if (!unitAStr && !unitBStr) return true;
    if (unitAStr && !unitBStr) return false;
    if (!unitAStr && unitBStr) return false;
    const unitA: MeasurementUnit = MEASUREMENT_UNITS[unitAStr.toLowerCase()];
    const unitB: MeasurementUnit = MEASUREMENT_UNITS[unitBStr.toLowerCase()];
    if (!unitA || !unitB) return false;
    return unitA.baseUnit == unitB.baseUnit;
}

export function getMetricUnitOptions(): any[] {
    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (value.label === 'unit') options.push({ value: value.label, label: value.label });
        else options.push({ value: value.label, label: value.label + ' (' + value.longLabelPlural + ')' });
    }
    return options;
}

export function getAltMetricUnitOptions(unitTypeStr: string, showLongLabel?: boolean): any[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[unitTypeStr?.toLowerCase()];
    if (!unit || unit.baseUnit === BASE_UNITS.COUNT) return [];

    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (value.baseUnit === unit.baseUnit) {
            if (!showLongLabel) options.push({ value: value.label, label: value.label });
            else options.push({ value: value.label, label: value.label + ' (' + value.longLabelPlural + ')' });
        }
    }
    return options;
}

export function getAltUnitKeys(unitTypeStr): string[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[unitTypeStr?.toLowerCase()];
    if (!unit) return [];

    const options = [];
    Object.values(MEASUREMENT_UNITS).forEach(value => {
        if (value.baseUnit === unit.baseUnit) options.push(value.label);
    });

    return options;
}

export function getMultiAltUnitKeys(unitTypeStrs: string[]): string[] {
    let compabitable = true;
    const unitTypeStr = unitTypeStrs[0];
    for (let i = 1; i < unitTypeStrs.length; i++) {
        if (!areUnitsCompatible(unitTypeStr, unitTypeStrs[i])) {
            compabitable = false;
            break;
        }
    }

    if (!compabitable) return [];

    if (!unitTypeStr) {
        // if no unit type, return all unit types
        const options = [];
        Object.values(MEASUREMENT_UNITS).forEach(value => {
            options.push(value.label);
        });
        return options;
    }
    return getAltUnitKeys(unitTypeStr);
}

export function convertUnitDisplay(
    amount: number,
    unit: string,
    displayUnit: string,
    includeUnits: boolean,
    emptyDisplay?: string
): string {
    // Allow for 0 so can't use !amount
    if (amount == null) {
        return emptyDisplay ? emptyDisplay : '';
    }
    if (!displayUnit) {
        return amount + (includeUnits && unit ? ' ' + unit : '');
    }
    if (!unit) {
        return amount + (includeUnits && displayUnit ? ' ' + displayUnit : '');
    }

    const currentUnit: MeasurementUnit = MEASUREMENT_UNITS[unit.toLowerCase()];
    const targetUnit: MeasurementUnit = MEASUREMENT_UNITS[displayUnit.toLowerCase()];
    if (!currentUnit || !targetUnit) return amount + (includeUnits ? ' ' + unit : '');

    const newAmount = amount * (currentUnit.ratio / targetUnit.ratio);
    // show up to 6 decimal points
    return parseFloat(newAmount.toFixed(6)).toString() + (includeUnits ? ' ' + displayUnit : '');
}

// volume unit (displayUnit): 10 mL (L)
// volume unit: 10 mL
// volume (displayUnit): 10 (L)
// volume: 10
// volume not set: null
export function getStoredAmountDisplay(rawValue: string, includeUnits?: boolean): string {
    if (!rawValue || !rawValue.trim()) return null;

    const parts: string[] = rawValue.trim().split(/\b\s+/);
    if (parts.length === 1) return rawValue;

    if (parts.length === 2) {
        if (includeUnits) {
            const unit = parts[1];
            if (unit.indexOf('(') === 0 && unit.indexOf(')') === unit.length - 1)
                return parts[0] + ' ' + unit.substring(1, unit.length - 1);
            else return rawValue;
        } else {
            return parts[0];
        }
    }

    if (parts.length === 3) {
        const volume = parts[0];
        const currentUnit = parts[1];
        const targetUnit = parts[2];
        return convertUnitDisplay(
            parseFloat(volume),
            currentUnit,
            targetUnit.substring(1, targetUnit.length - 1),
            includeUnits
        );
    }

    return rawValue;
}

export function getVolumeMinStep(sampleTypeUnit?: string | MeasurementUnit) {
    const step = 0.01;
    if (!sampleTypeUnit) return step;

    const unit = typeof sampleTypeUnit === 'string' ? MEASUREMENT_UNITS[sampleTypeUnit.toLowerCase()] : sampleTypeUnit;

    // If we don't know the units, or it is 'unit' then use the default
    if (!unit || unit === MEASUREMENT_UNITS.unit) return step;

    return Math.pow(10, -unit.displayPrecision); // Track uL and mg to a single unit
}

export function isMeasurementUnitIgnoreCase(expected: MeasurementUnit, val: string) {
    return expected.label.localeCompare(val, 'en-US', { sensitivity: 'base' }) === 0;
}

export function isValuePrecisionValid(value: number, precision: number): boolean {
    if (!value) {
        return true;
    }
    if (value < 0) {
        return false;
    }

    const valueValidator = new RegExp(`^\\d*(\\.\\d{0,${precision}})?$`);
    return valueValidator.test(value.toString());
}
