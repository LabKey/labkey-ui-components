/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { DataViewInfo, IDataViewInfo } from '../models';
import { naturalSort } from '..';

export function getOrDefault(value, defaultValue?) {
    return value ?? defaultValue;
}

export function dataViewInfoSorter(a: IDataViewInfo, b: DataViewInfo) {
    return naturalSort(a.name, b.name);
}
