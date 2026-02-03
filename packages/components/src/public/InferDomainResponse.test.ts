import { List } from 'immutable';
import { InferDomainResponse } from './InferDomainResponse';
import { QueryColumn } from './QueryColumn';

describe('InferDomainResponse.create', () => {
    test('returns empty collections when rawModel is undefined', () => {
        const res = InferDomainResponse.create({});
        expect(res.data.size).toBe(0);
        expect(res.fields.size).toBe(0);
        expect(res.reservedFields.size).toBe(0);
        expect(res.distinctValues.size).toBe(0);
        expect(res.commentLineCount).toBeUndefined();
    });

    test('converts plain JS data to immutable structures and preserves commentLineCount', () => {
        const raw = {
            data: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }],
            commentLineCount: 3,
        };
        const res = InferDomainResponse.create(raw);
        expect(res.data.size).toBe(2);
        // items are immutable Maps after fromJS
        expect((res.data.get(0) as any).get('id')).toBe(1);
        expect((res.data.get(1) as any).get('name')).toBe('b');
        expect(res.commentLineCount).toBe(3);
    });

    test('maps fields and reservedFields to QueryColumn instances', () => {
        const raw = {
            fields: [{ name: 'col1', type: 'string' }, { name: 'col2', type: 'int' }],
            reservedFields: [{ name: 'reserved', type: 'string' }],
        };
        const res = InferDomainResponse.create(raw);
        expect(res.fields.size).toBe(2);
        expect(res.reservedFields.size).toBe(1);

        expect(res.fields.get(0) instanceof QueryColumn).toBe(true);
        expect(res.fields.get(1) instanceof QueryColumn).toBe(true);
        expect(res.reservedFields.get(0) instanceof QueryColumn).toBe(true);
    });

    test('builds distinctValues map and getDistinctValuesForColumn returns a List', () => {
        const raw = {
            distinctValues: {
                col1: [null, 'a', 'b'],
                colEmpty: [],
            },
        };
        const res = InferDomainResponse.create(raw);

        const col1List = res.getDistinctValuesForColumn('col1') as List<string>;
        expect(col1List.toArray()).toEqual([null, 'a', 'b']);

        expect(res.getDistinctValuesForColumn('missing').size).toBe(0);
        expect(res.getDistinctValuesForColumn('colEmpty').size).toBe(0);
    });
});
