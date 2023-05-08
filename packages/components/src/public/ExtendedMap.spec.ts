import { OrderedMap } from 'immutable';
import { ExtendedMap } from './ExtendedMap';

const KEYS_ONE = ['one', 'two', 'three'];
const KEYS_TWO = ['four', 'five', 'six'];
const VALUES_ONE = [1, 2, 3];
const VALUES_TWO = [4, 5, 6];

// This is unordered because we're initializing from an object, which can't guarantee insert order
const UNORDERED = new ExtendedMap<string, number>({
    one: 1,
    two: 2,
    three: 3,
});
// These are ordered because we insert in a particular order, so order is guaranteed
const ORDERED_ONE = new ExtendedMap<string, number>();
ORDERED_ONE.set('one', 1);
ORDERED_ONE.set('two', 2);
ORDERED_ONE.set('three', 3);

const ORDERED_TWO = new ExtendedMap<string, number>();
ORDERED_TWO.set('four', 4);
ORDERED_TWO.set('five', 5);
ORDERED_TWO.set('six', 6);

describe('ExtendedMap', () => {
    function expectOrder(map: ExtendedMap<any, any>, keys: any[], values: any[]) {
        expect(Array.from(map.keys())).toStrictEqual(keys);
        expect(Array.from(map.values())).toStrictEqual(values);
        expect(map.keyArray).toStrictEqual(keys);
        expect(map.valueArray).toStrictEqual(values);
    }

    function expectValues(map, keys: any[], values: any[]) {
        let idx = 0;
        for (const key of keys) {
            expect(map.get(key)).toEqual(values[idx]);
            idx++;
        }
    }

    test('Constructor - empty args', () => {
        const em = new ExtendedMap<string, number>();
        expectOrder(em, [], []);
        em.set('one', 1);
        em.set('two', 2);
        em.set('three', 3);
        expectOrder(em, KEYS_ONE, VALUES_ONE);
        em.set('one', 'one');
        expectOrder(em, KEYS_ONE, ['one', 2, 3]);
        em.delete('one');
        em.set('one', 1);
        expectOrder(em, ['two', 'three', 'one'], [2, 3, 1]);
    });

    test('Constructor - Record', () => {
        expectValues(UNORDERED, KEYS_ONE, VALUES_ONE);
    });

    test('Constructor - null/undefined', () => {
        const emNull = new ExtendedMap(null);
        expectValues(emNull, [], []);

        const emUndefined = new ExtendedMap(undefined);
        expectValues(emUndefined, [], []);
    });

    test('Constructor - Map', () => {
        const map = new Map();
        map.set('one', 1);
        map.set('two', 2);
        map.set('three', 3);
        const em = new ExtendedMap<string, number>(map);
        expectOrder(em, KEYS_ONE, VALUES_ONE);
    });

    test('Constructor - ExtendedMap', () => {
        const em = new ExtendedMap<string, number>(ORDERED_ONE);
        expectOrder(em, KEYS_ONE, VALUES_ONE);
    });

    test('Constructor - Multiple', () => {
        const map = new Map();
        map.set('four', 4);
        map.set('five', 5);
        map.set('six', 6);
        const record = {
            seven: 7,
            eight: 8,
            nine: 9,
        };
        const em3 = new ExtendedMap<string, number>(ORDERED_ONE, map);
        expectOrder(em3, KEYS_ONE.concat(KEYS_TWO), VALUES_ONE.concat(VALUES_TWO));
        const em4 = new ExtendedMap<string, number>(ORDERED_ONE, map, record);
        expectValues(
            em4,
            KEYS_ONE.concat(KEYS_TWO).concat(['seven', 'eight', 'nine']),
            VALUES_ONE.concat(VALUES_TWO).concat([7, 8, 9])
        );
    });

    test('Constructor - from OrderedMap', () => {
        // In the long run we are trying to replace all usages of OrderedMap and Map with ExtendedMap, this test is here
        // to verify we can serialize OrderedMaps to JS then pass that to ExtendedMap as a stopgap while we convert
        // usages
        const om = OrderedMap({
            one: 1,
            two: 2,
            three: 3,
        });
        const em = new ExtendedMap(om.toJS());
        expectValues(em, KEYS_ONE, VALUES_ONE);
    });

    test('map', () => {
        const mappedEm: ExtendedMap<string, string> = ORDERED_ONE.map((value, key, original) => {
            return (value * original.size).toString(10);
        });
        expectOrder(mappedEm, KEYS_ONE, ['3', '6', '9']);
    });

    test('reduce', () => {
        const reducer = (result, value, key): ExtendedMap<string, number> => {
            if (value % 2 === 0) {
                result.set(key, value);
            }
            return result;
        };
        const reducedEm = ORDERED_ONE.reduce(reducer);
        expectValues(reducedEm, ['two'], [2]);

        const reducedWithInitial = ORDERED_ONE.reduce(reducer, new ExtendedMap(ORDERED_TWO));
        expectValues(reducedWithInitial, ['four', 'five', 'six', 'two'], [4, 5, 6, 2]);

        const reducedWithAlternateInitial = ORDERED_ONE.reduce(
            (result, value, key, original) => result + value * original.size,
            ''
        );
        expect(reducedWithAlternateInitial).toEqual('369');
    });

    test('filter', () => {
        const filtered = ORDERED_ONE.filter((value, key, original) => value % original.size === 0);
        expectValues(filtered, ['three'], [3]);
    });

    test('mapValues', () => {
        const mappedValues: string[] = ORDERED_ONE.mapValues((value, index, values) => {
            return (value * values.length).toString(10);
        });
        expect(mappedValues).toStrictEqual(['3', '6', '9']);
    });

    test('find', () => {
        const em = new ExtendedMap({
            'one': { name: 'one', value: 1 },
            'two': { name: 'two', value: 2 },
            'three': { name: 'three', value: 3 },
        });

        expect(em.find(obj => obj.name === 'two')).toStrictEqual({ name: 'two', value: 2 });
        expect(em.find(obj => obj.name === 'four')).toStrictEqual(undefined);
    });

    test('merge', () => {
        const em3 = ORDERED_ONE.merge(ORDERED_TWO);
        expectOrder(em3, KEYS_ONE.concat(KEYS_TWO), VALUES_ONE.concat(VALUES_TWO));

        const map = new Map();
        map.set('four', 4);
        map.set('five', 5);
        map.set('six', 6);
        const em4 = ORDERED_ONE.merge(map);
        expectOrder(em4, KEYS_ONE.concat(KEYS_TWO), VALUES_ONE.concat(VALUES_TWO));
    });

    test('mergeAt', () => {
        const invalidMerge1 = ORDERED_ONE.mergeAt(-5, ORDERED_TWO);
        expectOrder(invalidMerge1, KEYS_ONE, VALUES_ONE);

        const invalidMerge2 = ORDERED_ONE.mergeAt(4, ORDERED_TWO);
        expectOrder(invalidMerge2, KEYS_ONE, VALUES_ONE);

        const merged1 = ORDERED_ONE.mergeAt(0, ORDERED_TWO);
        expectOrder(merged1, KEYS_TWO.concat(KEYS_ONE), VALUES_TWO.concat(VALUES_ONE));

        const merged2 = ORDERED_ONE.mergeAt(1, ORDERED_TWO);
        expectOrder(merged2, ['one', 'four', 'five', 'six', 'two', 'three'], [1, 4, 5, 6, 2, 3]);

        const merged3 = ORDERED_ONE.mergeAt(2, ORDERED_TWO);
        expectOrder(merged3, ['one', 'two', 'four', 'five', 'six', 'three'], [1, 2, 4, 5, 6, 3]);

        const merged4 = ORDERED_ONE.mergeAt(3, ORDERED_TWO);
        expectOrder(merged4, KEYS_ONE.concat(KEYS_TWO), VALUES_ONE.concat(VALUES_TWO));
    });
});
