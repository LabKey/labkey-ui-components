import { immerable } from 'immer';

export enum UNITS_KIND {
    COUNT = 'Count',
    MASS = 'Mass',
    NONE = 'None',
    VOLUME = 'Volume',
}

export class UnitModel {
    [immerable] = true;

    readonly value: number;
    readonly unitStr?: string; //Originating unit string, may not be a typical MeasurementUnit
    readonly unit?: MeasurementUnit;

    constructor(value: number, unitStr: string) {
        const unit = getMeasurementUnit(unitStr) || null;
        Object.assign(this, { value, unitStr, unit });
    }

    isSupportedUnitType(): boolean {
        return this.unit != null;
    }

    canConvert(newUnitStr: string): boolean {
        if (!newUnitStr) {
            return this.unit == null;
        }

        const newUnit: MeasurementUnit = getMeasurementUnit(newUnitStr);
        return newUnit?.kind == this.unit?.kind;
    }

    as(newUnitStr: string): UnitModel {
        if (!this.canConvert(newUnitStr)) {
            throw new Error('Cannot convert to "' + newUnitStr + '"');
        }

        const newUnit = getMeasurementUnit(newUnitStr);
        if (!newUnit) {
            throw new Error('Unit type not supported "' + newUnitStr + '"');
        }

        if (this.value == null) {
            return new UnitModel(undefined, newUnit.label.toLowerCase());
        }

        const newValue = this.value * (this.unit.ratio / newUnit.ratio);
        const factor = Math.pow(10, newUnit.displayPrecision);
        const displayValue = Math.round(newValue * factor) / factor;
        return new UnitModel(displayValue, newUnit.label.toLowerCase());
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
        return this.value + (this.unit ? ' ' + this.unit.label : '');
    }

    toDisplayString(): string {
        return (this.value ? this.value.toLocaleString() : 0) + (this.unit ? ' ' + this.unit.label : '');
    }

    isValidForSubmit(): boolean {
        const hasBoth = this.value != undefined && this.unit != null;
        const hasNeither = this.value == undefined && this.unit == null;
        return hasBoth || hasNeither;
    }
}

export interface MeasurementUnit {
    altLabels?: string[];
    baseUnit: string;
    // Number of decimal places allowed when unit is displayed
    displayPrecision: number;
    kind: UNITS_KIND;
    label: string;
    longLabelPlural: string;
    longLabelSingular: string;
    ratio: number;
}

export const MEASUREMENT_UNITS: Record<string, MeasurementUnit> = {
    g: {
        label: 'g',
        baseUnit: 'g',
        longLabelSingular: 'gram',
        longLabelPlural: 'grams',
        kind: UNITS_KIND.MASS,
        ratio: 1,
        displayPrecision: 12, // enable smallest precision of pg and allow up to 3 decimal places for ng
    },
    mg: {
        baseUnit: 'g',
        label: 'mg',
        longLabelSingular: 'milligram',
        longLabelPlural: 'milligrams',
        kind: UNITS_KIND.MASS,
        ratio: 0.001,
        displayPrecision: 9,
    },
    kg: {
        baseUnit: 'g',
        label: 'kg',
        longLabelSingular: 'kilogram',
        longLabelPlural: 'kilograms',
        kind: UNITS_KIND.MASS,
        ratio: 1000,
        displayPrecision: 15,
    },
    ug: {
        baseUnit: 'g',
        label: 'ug',
        longLabelSingular: 'microgram',
        longLabelPlural: 'micrograms',
        kind: UNITS_KIND.MASS,
        ratio: 0.000001,
        displayPrecision: 6,
    },
    ng: {
        baseUnit: 'g',
        label: 'ng',
        longLabelSingular: 'nanogram',
        longLabelPlural: 'nanograms',
        kind: UNITS_KIND.MASS,
        ratio: 0.000000001,
        displayPrecision: 3,
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
        altLabels: ['blocks', 'bottle', 'box', 'cells', 'kit', 'pack', 'pcs', 'slides', 'tests'],
    },
};

export function getMeasurementUnit(unitStr: string): MeasurementUnit {
    if (!unitStr) return null;

    const unit = MEASUREMENT_UNITS[unitStr?.toLowerCase()];
    if (unit) return unit;

    const unitStrLc = unitStr.toLowerCase();
    if (MEASUREMENT_UNITS.unit.altLabels.indexOf(unitStrLc) > -1) {
        return {
            ...MEASUREMENT_UNITS.unit,
            label: unitStrLc,
            longLabelSingular: unitStrLc,
            longLabelPlural: unitStrLc,
        };
    }

    return null;
}

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
    const unitA: MeasurementUnit = getMeasurementUnit(unitAStr);
    const unitB: MeasurementUnit = getMeasurementUnit(unitBStr);
    if (!unitA || !unitB) {
        return false;
    }
    return unitA.kind === unitB.kind;
}

export function getMetricUnitOptions(metricUnit?: string, showLongLabel?: boolean): { label: string; value: string }[] {
    const unit: MeasurementUnit = getMeasurementUnit(metricUnit);

    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (!unit || value.kind === unit.kind) {
            if (!showLongLabel || value.kind === UNITS_KIND.COUNT) {
                options.push({ value: value.label, label: value.label });
            } else {
                options.push({ value: value.label, label: value.label + ' (' + value.longLabelPlural + ')' });
            }

            if (unit && value.kind === unit.kind) {
                unit.altLabels?.forEach(altLabel => {
                    options.push({ value: altLabel, label: altLabel });
                });
            }
        }
    }
    return options;
}

export function getMetricUnitOptionsFromKind(
    unitKind?: UNITS_KIND,
    showLongLabel?: boolean
): { label: string; value: string }[] {
    let metricUnit: string = null;
    switch (unitKind) {
        case UNITS_KIND.COUNT:
            metricUnit = 'unit';
            break;
        case UNITS_KIND.MASS:
            metricUnit = 'g';
            break;
        case UNITS_KIND.VOLUME:
            metricUnit = 'mL';
            break;
    }
    return getMetricUnitOptions(metricUnit, showLongLabel);
}

export function getAltUnitKeys(unitTypeStr): string[] {
    const unit: MeasurementUnit = getMeasurementUnit(unitTypeStr);
    const options = [];
    Object.values(MEASUREMENT_UNITS).forEach(value => {
        if (!unit || value.kind === unit.kind) {
            options.push(value.label);
            if (value.altLabels) {
                options.push(...value.altLabels);
            }
        }
    });

    return options;
}

export function getVolumeMinStep(sampleTypeUnit?: MeasurementUnit | string) {
    const step = 0.01;
    if (!sampleTypeUnit) {
        return step;
    }

    const unit = typeof sampleTypeUnit === 'string' ? getMeasurementUnit(sampleTypeUnit) : sampleTypeUnit;

    // If we don't know the units, or it is 'unit' then use the default
    if (!unit || unit.baseUnit === MEASUREMENT_UNITS.unit.baseUnit) {
        return step;
    }

    return Math.pow(10, -unit.displayPrecision); // Track uL and mg to a single unit
}

export function isMeasurementUnitIgnoreCase(expected: MeasurementUnit, val: string) {
    return expected.label.localeCompare(val, 'en-US', { sensitivity: 'base' }) === 0;
}
