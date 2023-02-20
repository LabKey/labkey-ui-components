import { immerable } from 'immer';

import { areUnitsCompatible, MEASUREMENT_UNITS } from './utils';

export enum BASE_UNITS {
    COUNT = 'Count',
    MASS = 'Mass',
    VOLUME = 'Volume',
}

export interface MeasurementUnit {
    baseUnit: BASE_UNITS;
    // Number of decimal places allowed when unit is displayed
    displayPrecision: number;
    label: string;
    longLabelPlural: string;
    longLabelSingular: string;
    ratio: number;
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
        if (!newUnitStr)
            return this.unit == null;

        const newUnit : MeasurementUnit = MEASUREMENT_UNITS[newUnitStr.toLowerCase()];
        return newUnit?.baseUnit == this.unit?.baseUnit;
    }

    as(newUnitStr: string) : UnitModel {
        if (!this.canConvert(newUnitStr))
            throw new Error('Cannot convert to "' + newUnitStr + '"');

        const newUnit = MEASUREMENT_UNITS[newUnitStr?.toLowerCase()];
        if (!newUnit) {
            throw new Error('Unit type not supported "' + newUnitStr + '"');
        }

        if (this.value == null)
            return new UnitModel(0, newUnit.label.toLowerCase());

        const newValue = this.value * (this.unit.ratio / newUnit.ratio);
        return new UnitModel(parseFloat(newValue.toFixed(6)), newUnit.label.toLowerCase());
    }

    add(deltaValue: number, deltaUnitStr?: string) {
        let deltaUnit : MeasurementUnit = this.unit;
        if (deltaUnitStr) {
            if (!this.canConvert(deltaUnitStr))
                throw new Error('Cannot add "' + deltaUnitStr + '" to "' + this.unit?.label + '"');

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
        if (!areUnitsCompatible(unitStr, otherUnitStr))
            return undefined;

        if (this.value == null && other.value != null)
            return undefined;
        if (this.value != null && other.value == null)
            return undefined;

        if (unitStr == otherUnitStr)
            return this.value - other.value;

        return this.value - other.as(unitStr).value;
    }

    toString(): string {
        return this.value + (this.unit ? (' ' + this.unit.label) : '');
    }

    toDisplayString(): string {
        return (this.value ? this.value.toLocaleString() : 0) + (this.unit ? (' ' + this.unit.label) : '');
    }

}
