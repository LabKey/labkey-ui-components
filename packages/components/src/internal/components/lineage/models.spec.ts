import { applyLineageOptions, LineageIO } from './models';
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

describe('LineageIO.applyConfig', () => {
    const lineageObj = {
        container: 'container',
        created: '2022-01-20',
        createdBy: 'me',
        modified: '2022-01-21',
        modifiedBy: 'me',
        expType: 'type',
        id: 1,
        lsid: 'abc:123',
        name: 'name',
        pkFilters: [],
        queryName: 'query',
        schemaName: 'schema',
    };

    it('dataInputs', () => {
        expect(LineageIO.applyConfig({}).dataInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataInputs: undefined }).dataInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataInputs: [] }).dataInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataInputs: [{ ...lineageObj }] }).dataInputs.length).toBe(1);
    });

    it('dataOutputs', () => {
        expect(LineageIO.applyConfig({}).dataOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataOutputs: undefined }).dataOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataOutputs: [] }).dataOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ dataOutputs: [{ ...lineageObj }] }).dataOutputs.length).toBe(1);
    });

    it('materialInputs', () => {
        expect(LineageIO.applyConfig({}).materialInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialInputs: undefined }).materialInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialInputs: [] }).materialInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialInputs: [{ ...lineageObj }] }).materialInputs.length).toBe(1);
    });

    it('materialOutputs', () => {
        expect(LineageIO.applyConfig({}).materialOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialOutputs: undefined }).materialOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialOutputs: [] }).materialOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ materialOutputs: [{ ...lineageObj }] }).materialOutputs.length).toBe(1);
    });

    it('objectInputs', () => {
        expect(LineageIO.applyConfig({}).objectInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ provenanceMap: undefined }).objectInputs.length).toBe(0);
        expect(LineageIO.applyConfig({ provenanceMap: [] }).objectInputs.length).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: undefined,
                        to: { ...lineageObj },
                    },
                ],
            }).objectInputs.length
        ).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: undefined,
                        to: undefined,
                    },
                ],
            }).objectInputs.length
        ).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: { ...lineageObj },
                        to: undefined,
                    },
                ],
            }).objectInputs.length
        ).toBe(1);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: { ...lineageObj },
                        to: { ...lineageObj },
                    },
                ],
            }).objectInputs.length
        ).toBe(1);
    });

    it('objectOutputs', () => {
        expect(LineageIO.applyConfig({}).objectOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ provenanceMap: undefined }).objectOutputs.length).toBe(0);
        expect(LineageIO.applyConfig({ provenanceMap: [] }).objectOutputs.length).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: undefined,
                        to: { ...lineageObj },
                    },
                ],
            }).objectOutputs.length
        ).toBe(1);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: undefined,
                        to: undefined,
                    },
                ],
            }).objectOutputs.length
        ).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: { ...lineageObj },
                        to: undefined,
                    },
                ],
            }).objectOutputs.length
        ).toBe(0);
        expect(
            LineageIO.applyConfig({
                provenanceMap: [
                    {
                        from: { ...lineageObj },
                        to: { ...lineageObj },
                    },
                ],
            }).objectOutputs.length
        ).toBe(1);
    });
});
