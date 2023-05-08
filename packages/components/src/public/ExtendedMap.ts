type KeyType = string | number | symbol;
type MapType<K extends KeyType, V> = Record<K, V> | Map<K, V>;
type Mapper<K extends KeyType, V, T> = (value: V, key: K, original: ExtendedMap<K, V>) => T;
type ArrayMapper<V, T> = (value: V, index: number, array: V[]) => T;
type FilterFn<K extends KeyType, V> = (value: V, key: K, original: ExtendedMap<K, V>) => boolean;
type Reducer<K extends KeyType, V, T> = (result: T, value: V, key: K, original: ExtendedMap<K, V>) => T;

/**
 * ExtendedMap is an extended version of the built in Map class. It has an improved constructor (that takes Records,
 * Map, or ExtendedMap objects), as well as several convenience methods for mapping, reducing, and filtering the map or
 * values. This class is an Ordered Map, because it extends the Map class which is ordered.
 */
export class ExtendedMap<K extends KeyType, V> extends Map {
    constructor(...data: Array<Record<KeyType, V> | Map<KeyType, V>>) {
        super();

        for (const dataObject of data) {
            if (dataObject === null || dataObject === undefined) continue;

            if (dataObject instanceof Map) {
                for (const [key, value] of dataObject) {
                    this.set(key, value);
                }
            } else {
                // Assume Record type
                for (const key of Object.keys(dataObject)) {
                    this.set(key, dataObject[key]);
                }
            }
        }
    }

    /**
     * Use this when you want to map or reduce over the values of the Map, or otherwise need an array. If you just need
     * to iterate through the values you should be able to use the values() method.
     */
    get valueArray(): V[] {
        return Array.from(this.values());
    }

    /**
     * Use this when you want to map or reduce over the keys of the Map, or otherwise need an array. If you just need
     * to iterate through the keys you should be able to use the keys() method.
     */
    get keyArray(): KeyType[] {
        return Array.from(this.keys());
    }

    /**
     * Iterates over the ExtendedMap, calling the provided Mapper function for each key/value. Allows you to transform
     * the values of the map.
     * @param mapper
     */
    map<T>(mapper: Mapper<K, V, T>): ExtendedMap<K, T> {
        const newMap = new ExtendedMap<K, T>();

        for (const [key, value] of this) {
            newMap.set(key, mapper(value, key, this));
        }

        return newMap;
    }

    /**
     * Iterates over the ExtendedMap, calling the provided Reducer function for each key/value. Allows you to completely
     * transform the ExtendedMap object into something else (e.g. a string, a filtered version of the map).
     * @param reducer
     * @param initialReduction
     */
    reduce<T>(reducer: Reducer<K, V, T>, initialReduction?: T): T {
        let result = initialReduction === undefined ? new ExtendedMap() : initialReduction;

        for (const [key, value] of this) {
            result = reducer(result as T, value, key, this);
        }

        return result as T;
    }

    /**
     * Creates a new ExtendedMap based on the filter function a passed in. Iterates through all of the values of the map
     * and calls the filter function with the key, value, and whole map. If the filter function returns true we include
     * the key/value pair in the new map.
     * @param filterFn
     */
    filter(filterFn: FilterFn<K, V>): ExtendedMap<K, V> {
        const newMap = new ExtendedMap<K, V>();
        for (const [key, value] of this) {
            if (filterFn(value, key, this)) newMap.set(key, value);
        }
        return newMap;
    }

    /**
     * A convenience function to map over the values of the ExtendedMap. Equivalent to Array.from(myMap.values()).map().
     * @param mapper
     */
    mapValues<T>(mapper: ArrayMapper<V, T>): T[] {
        return this.valueArray.map(mapper);
    }

    find(filterFn: FilterFn<K, V>): V {
        for (const [key, value] of this) {
            if (filterFn(value, key, this)) return value;
        }
    }

    /**
     * Creates a new ExtendedMap based on this map and the map passed in as an argument.
     * @param otherMap
     */
    merge(otherMap: MapType<K, V> | ExtendedMap<K, V>): ExtendedMap<K, V> {
        return new ExtendedMap<K, V>(this, otherMap);
    }

    /**
     * Inserts the contents of a map at the designated index. If the given index is out of range of the existing map we
     * return a copy of the current map. If the given index is equal to the current size of the map we append the
     * incoming otherMap.
     * @param index: the index where to insert the otherMap
     * @param otherMap: the otherMap to insert
     */
    mergeAt(index: number, otherMap: MapType<K, V> | ExtendedMap<K, V>): ExtendedMap<K, V> {
        // Invalid, return a copy of this map
        if (index < 0 || index > this.size) return new ExtendedMap<K, V>(this);

        // Append
        if (index === this.size) return new ExtendedMap<K, V>(this, otherMap);

        // Prepend
        if (index === 0) return new ExtendedMap<K, V>(otherMap, this);

        const before = new Map();
        const after = new Map();
        let curIndex = 0;

        for (const [key, value] of this) {
            if (curIndex < index) {
                before.set(key, value);
            } else {
                after.set(key, value);
            }
            curIndex++;
        }

        return new ExtendedMap<K, V>(before, otherMap, after);
    }
}
