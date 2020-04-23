import { applyLineageOptions } from './models';
import { DEFAULT_LINEAGE_OPTIONS } from './constants';
import { LineageFilter } from './types';

describe('applyLineageOptions', () => {
    it('use default options', () => {
        expect(applyLineageOptions()).toStrictEqual(DEFAULT_LINEAGE_OPTIONS);
    });

    it('apply lineage options', () => {
        const filters = [new LineageFilter('someField', ['testValue'])];
        const filteredOptions = applyLineageOptions({ filters });
        expect(filteredOptions).toHaveProperty('filters', filters);

        // Check deep copy
        filters[0].field = 'Jazz';
        expect(filteredOptions.filters[0].field).toBe('someField');
    });

    it('apply grouping options', () => {
        expect(applyLineageOptions({ grouping: { childDepth: 99 } })).toHaveProperty(['grouping', 'childDepth'], 99);
    });
});
