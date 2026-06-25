/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { applyLineageOptions, generateNodesAndEdges, Lineage, LineageIO, LineageNode, LineageResult } from './models';
import { DEFAULT_LINEAGE_OPTIONS } from './constants';
import { LineageFilter, LineageOptions } from './types';

describe('lineage model', () => {
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
            expect(applyLineageOptions({ grouping: { childDepth: 99 } })).toHaveProperty(
                ['grouping', 'childDepth'],
                99
            );
        });
    });

    describe('LineageIO.applyConfig', () => {
        const lineageObj = {
            container: 'container',
            containerPath: '/container',
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

    describe('generateNodesAndEdges', () => {
        // Regression coverage for Issue 51425
        it('reprocesses level', () => {
            // Arrange
            const childOneLsid = 'child-one-lsid';
            const childTwoLsid = 'child-two-lsid';
            const childThreeLsid = 'child-three-lsid';
            const childFourLsid = 'child-four-lsid';
            const parentLsid = 'parent-lsid';

            const childOneNode = LineageNode.create(childOneLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childTwoNode = LineageNode.create(childTwoLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childThreeNode = LineageNode.create(childThreeLsid, {
                children: [{ lsid: childFourLsid }],
                parents: [{ lsid: parentLsid }],
            });

            const childFourNode = LineageNode.create(childFourLsid, {
                parents: [
                    { lsid: parentLsid },
                    { lsid: childOneLsid },
                    { lsid: childTwoLsid },
                    { lsid: childThreeLsid },
                ],
            });

            const parentNode = LineageNode.create(parentLsid, {
                children: [{ lsid: childOneLsid }, { lsid: childTwoLsid }, { lsid: childThreeLsid }],
            });

            const result = LineageResult.create({
                nodes: {
                    [parentNode.lsid]: parentNode,
                    [childOneNode.lsid]: childOneNode,
                    [childTwoNode.lsid]: childTwoNode,
                    [childThreeNode.lsid]: childThreeNode,
                    [childFourNode.lsid]: childFourNode,
                },
                seed: childFourNode.lsid,
            });

            // Act
            const { edges, nodes } = generateNodesAndEdges(result);

            // Assert
            expect(Object.keys(edges).length).toEqual(7);
            expect(Object.keys(nodes).length).toEqual(5);

            expect(nodes[parentNode.lsid].level).toEqual(-2);
            expect(nodes[childOneNode.lsid].level).toEqual(-1);
            expect(nodes[childTwoNode.lsid].level).toEqual(-1);
            expect(nodes[childThreeNode.lsid].level).toEqual(-1);
            expect(nodes[childFourNode.lsid].level).toEqual(0);
        });

        it('Issue 51432: special character in sample names result in: SyntaxError: unterminated character class', () => {
            const childLsid = 'child-lsid';
            const parentLsid = 'parent-lsid';

            const childNode = LineageNode.create(childLsid, {
                parents: [{ lsid: parentLsid }],
                name: '&4[0_1001',
            });

            const parentNode = LineageNode.create(parentLsid, {
                children: [{ lsid: childLsid }],
                name: '&4[0',
            });

            const result = LineageResult.create({
                nodes: {
                    [parentNode.lsid]: parentNode,
                    [childNode.lsid]: childNode,
                },
                seed: childNode.lsid,
            });

            const { edges, nodes } = generateNodesAndEdges(result);

            expect(Object.keys(edges).length).toEqual(1);
            expect(Object.keys(nodes).length).toEqual(2);

            expect(nodes[parentNode.lsid].level).toEqual(-1);
            expect(nodes[parentNode.lsid].label).toEqual('＆4[0');
            expect(nodes[childNode.lsid].level).toEqual(0);
            expect(nodes[childNode.lsid].label).toEqual('＆4[0_1001');
        });

        it('GH Issue #1256: Lineage graph can become disconnected with single aliquot and multiple derivatives', () => {
            // Parent sample with 2 derived samples and 1 aliquot including derivation runs
            const result = LineageResult.create({
                nodes: {
                    'aliquot-lsid': {
                        cpasType: 'sample-type-lsid',
                        materialLineageType: 'Aliquot',
                        type: 'Sample',
                        lsid: 'aliquot-lsid',
                        name: 'Aliquot-1',
                        expType: 'Material',
                        parents: [{ lsid: 'aliquot-run-lsid' }],
                    },
                    'aliquot-run-lsid': {
                        cpasType: 'urn:lsid:labkey.org:Protocol:SampleAliquotProtocol',
                        type: 'Run',
                        lsid: 'aliquot-run-lsid',
                        children: [{ lsid: 'aliquot-lsid' }],
                        name: 'Create aliquot from Parent-1',
                        expType: 'ExperimentRun',
                        parents: [{ lsid: 'parent-lsid' }],
                    },
                    'derived-one-lsid': {
                        cpasType: 'sample-type-lsid',
                        materialLineageType: 'Derivative',
                        type: 'Sample',
                        lsid: 'derived-one-lsid',
                        name: 'Derived-1',
                        expType: 'Material',
                        parents: [{ lsid: 'derivation-run-lsid' }],
                    },
                    'derived-two-lsid': {
                        cpasType: 'sample-type-lsid',
                        materialLineageType: 'Derivative',
                        type: 'Sample',
                        lsid: 'derived-two-lsid',
                        name: 'Derived-2',
                        expType: 'Material',
                        parents: [{ lsid: 'derivation-run-lsid' }],
                    },
                    'derivation-run-lsid': {
                        cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
                        type: 'Run',
                        lsid: 'derivation-run-lsid',
                        children: [{ lsid: 'derived-two-lsid' }, { lsid: 'derived-one-lsid' }],
                        name: 'Derive 2 samples from Parent-1',
                        expType: 'ExperimentRun',
                        parents: [{ lsid: 'parent-lsid' }],
                    },
                    'parent-lsid': {
                        cpasType: 'sample-type-lsid',
                        materialLineageType: 'RootMaterial',
                        type: 'Sample',
                        lsid: 'parent-lsid',
                        children: [{ lsid: 'aliquot-run-lsid' }, { lsid: 'derivation-run-lsid' }],
                        name: 'Parent-1',
                        expType: 'Material',
                    },
                },
                seed: 'parent-lsid',
            });

            const options: LineageOptions = {
                filters: [new LineageFilter('type', ['Sample'])],
            };

            const lineage = new Lineage({ result });
            const nodesAndEdges = generateNodesAndEdges(lineage.filterResult(options), options);

            // Runs have been filtered out
            const expectedNodes = new Set(['aliquot-lsid', 'derived-one-lsid', 'derived-two-lsid', 'parent-lsid']);
            expect(new Set(Object.keys(nodesAndEdges.nodes))).toEqual(expectedNodes);

            // Previously, this would have only two edges where the edge between the parent and aliquot was missing
            const expectedEdges = new Set([
                'parent-lsid||aliquot-lsid',
                'parent-lsid||derived-one-lsid',
                'parent-lsid||derived-two-lsid',
            ]);
            expect(new Set(Object.keys(nodesAndEdges.edges))).toEqual(expectedEdges);
        });
    });
});
