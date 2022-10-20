import { Filter } from '@labkey/api';

export interface AssaySampleColumnProp {
    fieldKey: string;
    lookupFieldKey: string;
}

/**
 * This implements the filter corresponding to PicklistSampleCompareType.  Updates there should also be reflected here.
 */
class PicklistSamplesFilter implements Filter.IFilterType {
    getDisplaySymbol(): string {
        return null;
    }
    getDisplayText(): string {
        return 'Sample for picklist';
    }
    getLongDisplayText(): string {
        return this.getDisplayText();
    }
    getURLSuffix(): string {
        return 'picklistsamples';
    }
    isDataValueRequired(): boolean {
        return true;
    }
    isMultiValued(): boolean {
        return false;
    }
    isTableWise(): boolean {
        return false;
    }
    getMultiValueFilter(): Filter.IFilterType {
        return null;
    }
    getMultiValueMaxOccurs(): number {
        return 0;
    }
    getMultiValueMinOccurs(): number {
        return 0;
    }
    getMultiValueSeparator(): string {
        return null;
    }
    getOpposite(): Filter.IFilterType {
        return null;
    }
    getSingleValueFilter(): Filter.IFilterType {
        return null;
    }
    parseValue(value: any) {
        return value;
    }
    getURLParameterValue(value: any) {
        return value;
    }
    validate(value: any, jsonType: string, columnName: string) {}
    getLabKeySqlOperator(): string {
        return null;
    }
}

export const PICKLIST_SAMPLES_FILTER = new PicklistSamplesFilter();
