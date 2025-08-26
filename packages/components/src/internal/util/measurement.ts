import { immerable } from 'immer';

export enum UNITS_KIND {
    COUNT = 'Count',
    MASS = 'Mass',
    VOLUME = 'Volume',
}

export class UnitModel {
    [immerable] = true;

    readonly value: number;
    readonly unitStr?: string; //Originating unit string, may not be a typical MeasurementUnit
    readonly unit?: MeasurementUnit;

    constructor(value: number, unitStr: string) {
        const unit = MEASUREMENT_UNITS[unitStr?.toLowerCase()] || null;
        Object.assign(this, {value, unitStr, unit});
    }

    isSupportedUnitType(): boolean {
        return this.unit != null;
    }

    canConvert(newUnitStr: string): boolean {
        if (!newUnitStr) {
            return this.unit == null;
        }

        const newUnit: MeasurementUnit = MEASUREMENT_UNITS[newUnitStr.toLowerCase()];
        return newUnit?.kind == this.unit?.kind;
    }

    as(newUnitStr: string): UnitModel {
        if (!this.canConvert(newUnitStr)) {
            throw new Error('Cannot convert to "' + newUnitStr + '"');
        }

        const newUnit = MEASUREMENT_UNITS[newUnitStr?.toLowerCase()];
        if (!newUnit) {
            throw new Error('Unit type not supported "' + newUnitStr + '"');
        }

        if (this.value == null) {
            return new UnitModel(undefined, newUnit.label.toLowerCase());
        }

        const newValue = this.value * (this.unit.ratio / newUnit.ratio);
        return new UnitModel(parseFloat(newValue.toFixed(newUnit.displayPrecision)), newUnit.label.toLowerCase());
    }

    add(deltaValue: number, deltaUnitStr?: string) {
        let deltaUnit: MeasurementUnit = this.unit;
        if (deltaUnitStr) {
            if (!this.canConvert(deltaUnitStr)) {
                throw new Error('Cannot add "' + deltaUnitStr + '" to "' + this.unit?.label + '"');
            }

            deltaUnit = MEASUREMENT_UNITS[deltaUnitStr.toLowerCase()];
            if (!deltaUnit) {
                throw new Error('Unit type not supported "' + deltaUnitStr + '"');
            }
        }

        if (!this.unit) {
            return new UnitModel(this.value + deltaValue, this.unit?.label?.toLowerCase());
        }

        const newValue = this.value + deltaValue * (deltaUnit.ratio / this.unit.ratio);
        return new UnitModel(newValue, this.unit.label.toLowerCase());
    }

    compareTo(other: UnitModel) {
        const unitStr = this.unit?.label;
        const otherUnitStr = other.unit?.label;
        if (!areUnitsCompatible(unitStr, otherUnitStr)) {
            return undefined;
        }

        if (this.value == null && other.value != null) {
            return undefined;
        }
        if (this.value != null && other.value == null) {
            return undefined;
        }

        if (unitStr == otherUnitStr) {
            return this.value - other.value;
        }

        return this.value - other.as(unitStr).value;
    }

    toString(): string {
        return this.value + (this.unit ? (' ' + this.unit.label) : '');
    }

    toDisplayString(): string {
        return (this.value ? this.value.toLocaleString() : 0) + (this.unit ? (' ' + this.unit.label) : '');
    }

    isValidForSubmit(): boolean {
        return this.value == undefined || (this.value != undefined && this.unit != null);
    }
}

export interface MeasurementUnit {
    baseUnit: string;
    // Number of decimal places allowed when unit is displayed
    displayPrecision: number;
    kind: UNITS_KIND;
    label: string;
    longLabelPlural: string;
    longLabelSingular: string;
    ratio: number;
}

export const MEASUREMENT_UNITS: { [key: string]: MeasurementUnit } = {
    g: {
        label: 'g',
        baseUnit: 'g',
        longLabelSingular: 'gram',
        longLabelPlural: 'grams',
        kind: UNITS_KIND.MASS,
        ratio: 1,
        displayPrecision: 9, // enable smallest precision of ng
    },
    mg: {
        baseUnit: 'g',
        label: 'mg',
        longLabelSingular: 'milligram',
        longLabelPlural: 'milligrams',
        kind: UNITS_KIND.MASS,
        ratio: 0.001,
        displayPrecision: 6,
    },
    kg: {
        baseUnit: 'g',
        label: 'kg',
        longLabelSingular: 'kilogram',
        longLabelPlural: 'kilograms',
        kind: UNITS_KIND.MASS,
        ratio: 1000,
        displayPrecision: 12, // enable smallest precision of ng
    },
    ml: {
        baseUnit: 'mL',
        label: 'mL',
        longLabelSingular: 'milliliter',
        longLabelPlural: 'milliliters',
        kind: UNITS_KIND.VOLUME,
        ratio: 1,
        displayPrecision: 6, // enable smallest precision of nanoliters
    },
    ul: {
        baseUnit: 'mL',
        label: 'uL',
        longLabelSingular: 'microliter',
        longLabelPlural: 'microliters',
        kind: UNITS_KIND.VOLUME,
        ratio: 0.001,
        displayPrecision: 3,
    },
    l: {
        baseUnit: 'mL',
        label: 'L',
        longLabelSingular: 'liter',
        longLabelPlural: 'liters',
        kind: UNITS_KIND.VOLUME,
        ratio: 1000,
        displayPrecision: 9,
    },
    unit: {
        baseUnit: 'unit',
        label: 'unit',
        longLabelSingular: 'unit',
        longLabelPlural: 'unit',
        kind: UNITS_KIND.COUNT,
        ratio: 1,
        displayPrecision: 2,
    },
};

/**
 * @param unitAStr
 * @param unitBStr
 */
export function areUnitsCompatible(unitAStr: string, unitBStr: string) {
    if (unitAStr == unitBStr) {
        return true;
    }
    if (!unitAStr && !unitBStr) {
        return true;
    }
    if (unitAStr && !unitBStr) {
        return false;
    }
    if (!unitAStr && unitBStr) {
        return false;
    }
    const unitA: MeasurementUnit = MEASUREMENT_UNITS[unitAStr.toLowerCase()];
    const unitB: MeasurementUnit = MEASUREMENT_UNITS[unitBStr.toLowerCase()];
    if (!unitA || !unitB) {
        return false;
    }
    return unitA.kind == unitB.kind;
}

export function getMetricUnitOptions(metricUnit?: string, showLongLabel?: boolean): any[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[metricUnit?.toLowerCase()];

    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (!unit || value.kind === unit.kind) {
            if (!showLongLabel || value.kind === UNITS_KIND.COUNT) {
                options.push({ value: value.label, label: value.label });
            } else {
                options.push({ value: value.label, label: value.label + ' (' + value.longLabelPlural + ')' });
            }
        }
    }
    return options;
}

export function getAltUnitKeys(unitTypeStr): string[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[unitTypeStr?.toLowerCase()];
    const options = [];
    Object.values(MEASUREMENT_UNITS).forEach(value => {
        if (!unit || value.kind === unit.kind) {
            options.push(value.label);
        }
    });

    return options;
}

export function getVolumeMinStep(sampleTypeUnit?: string | MeasurementUnit) {
    const step = 0.01;
    if (!sampleTypeUnit) {
        return step;
    }

    const unit = typeof sampleTypeUnit === 'string' ? MEASUREMENT_UNITS[sampleTypeUnit.toLowerCase()] : sampleTypeUnit;

    // If we don't know the units, or it is 'unit' then use the default
    if (!unit || unit === MEASUREMENT_UNITS.unit) {
        return step;
    }

    return Math.pow(10, -unit.displayPrecision); // Track uL and mg to a single unit
}

export function isMeasurementUnitIgnoreCase(expected: MeasurementUnit, val: string) {
    return expected.label.localeCompare(val, 'en-US', {sensitivity: 'base'}) === 0;
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
