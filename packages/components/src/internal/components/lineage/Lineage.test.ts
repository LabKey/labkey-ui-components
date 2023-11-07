/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Edge } from 'vis-network';

import {
    collapsedNodesTest1,
    collapsedNodesTest2,
    collapsedNodesTest3,
    fullScreenLineageSample,
    lineageExpressionSystem,
    lineageSample,
} from '../../../test/data/lineageData';

import { LoadingState } from '../../../public/LoadingState';

import { LineageFilter, LINEAGE_GROUPING_GENERATIONS } from './types';
import { generate, Lineage, LineageResult, VisGraphCombinedNode } from './models';

describe('Lineage Graph', () => {
    // expression1 -> run1 -> child1
    //             -> run2
    //
    // seed = expression1
    const ESLineageResult = LineageResult.create(lineageExpressionSystem);
    const ESLineage = new Lineage({
        result: ESLineageResult,
        resultLoadingState: LoadingState.LOADED,
    });

    // expression1 -> run1 -> child1
    //             -> run2
    //
    // seed = child1
    const sampleLineageResult = LineageResult.create(lineageSample);
    const sampleLineage = new Lineage({
        result: sampleLineageResult,
        resultLoadingState: LoadingState.LOADED,
    });

    // S0 -> R1 -> S1 -> R2 -> S2 -> R3 -> S3 -> R4  -> S4 -> R5 -> S5 -> R7 -> S7
    //                                     S6 -> R42 -> S4             -> R8 -> S8
    //
    // seed = S4
    const fullScreenSampleLineageResult = LineageResult.create(fullScreenLineageSample);
    const fullScreenSampleLineage = new Lineage({
        result: fullScreenSampleLineageResult,
        resultLoadingState: LoadingState.LOADED,
    });

    describe('Lineage', () => {
        describe('#generateGraph()', () => {
            test('generations=All', () => {
                const visGraphOptions = ESLineage.generateGraph({
                    grouping: { generations: LINEAGE_GROUPING_GENERATIONS.All },
                });
                expect(visGraphOptions.nodes.length).toBe(4);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['expression1', 'run1', 'run2', 'child1']));
            });

            test('generations=Multi', () => {
                // generations=Multi will stop iterating at the first branch
                const visGraphOptions = ESLineage.generateGraph({
                    grouping: { generations: LINEAGE_GROUPING_GENERATIONS.Multi },
                });
                expect(visGraphOptions.nodes.length).toBe(3);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['expression1', 'run1', 'run2']));
            });

            test('filtering in only type Data and generations=All', () => {
                const visGraphOptions = ESLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Data'])],
                    filterIn: true,
                });
                expect(visGraphOptions.nodes.length).toBe(1);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['expression1']));
                expect(ids).toEqual(expect.not.arrayContaining(['run1', 'run2', 'child1']));
            });

            test('filtering out only type Data (including the seed)', () => {
                // For now, filtering out the seed means the rest of the nodes
                // aren't reachable.  If the seed is filtered, we could promote
                // the seed's relative to the 'top' nodes of the graph so the
                // they become reachable again.
                const visGraphOptions = ESLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Data'])],
                    filterIn: false,
                });
                expect(visGraphOptions.nodes.length).toBe(0);
            });

            test('Expression System lineage filtering in only type Sample with generations=Multi', () => {
                const visGraphOptions = ESLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample'])],
                    filterIn: true,
                    grouping: { generations: LINEAGE_GROUPING_GENERATIONS.Multi },
                });
                // there is only 1 node of type Sample in the ESLineage,
                // but it will not show because the seed is of type Data and is being filtered out
                expect(visGraphOptions.nodes.length).toBe(0);
            });

            test('Sample Lineage filtering in only type Sample with generations=Multi', () => {
                const visGraphOptions = sampleLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample'])],
                    filterIn: true,
                    grouping: { generations: LINEAGE_GROUPING_GENERATIONS.Multi },
                });
                expect(visGraphOptions.nodes.length).toBe(1);
                expect(visGraphOptions.nodes.getIds()).toContain('child1');
            });

            test('Expression System lineage filtering in only types Data or Sample with generations=Multi and combineSize=2', () => {
                const visGraphOptions = ESLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample', 'Data'])],
                    filterIn: true,
                    grouping: {
                        combineSize: 2,
                        generations: LINEAGE_GROUPING_GENERATIONS.Multi,
                    },
                });
                expect(visGraphOptions.nodes.length).toBe(2);
            });

            test('Sample lineage filtering in only types Data or Sample with multi generations and children clustering', () => {
                const visGraphOptions = sampleLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample', 'Data'])],
                    filterIn: true,
                    grouping: {
                        combineSize: 2,
                        generations: LINEAGE_GROUPING_GENERATIONS.Multi,
                    },
                });
                expect(visGraphOptions.nodes.length).toBe(2);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['expression1', 'child1']));
                expect(ids).toEqual(expect.not.arrayContaining(['run1', 'run2']));
            });

            test('fullScreenSampleLineage lineage with all generations and clustering', () => {
                const graph = fullScreenSampleLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample'])],
                    filterIn: true,
                    grouping: {
                        combineSize: 2,
                        generations: LINEAGE_GROUPING_GENERATIONS.All,
                    },
                });
                expect(graph.nodes.length).toBe(7);
                expect(graph.edges.length).toBe(6);

                const ids = graph.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['sample0', 'sample1', 'sample2', 'sample4', 'sample5']));
                expect(ids).toEqual(
                    expect.not.arrayContaining([
                        'sample3',
                        'sample6',
                        'sample7',
                        'sample8',
                        'run1',
                        'run2',
                        'run3',
                        'run4',
                        'run42',
                        'run5',
                        'run7',
                        'run8',
                    ])
                );

                const fromS4 = graph.edges.get({ filter: e => e.from === 'sample4' });
                expect(fromS4.length).toBe(1);
                expect(fromS4[0].to).toBe('sample5');

                const toS4 = graph.edges.get({ filter: e => e.to === 'sample4' });
                expect(toS4.length).toBe(1);
                expect(toS4[0].from).toContain('combined:');
                const combinedNode1Id = toS4[0].from;
                const combinedNode1 = graph.nodes.get(combinedNode1Id) as VisGraphCombinedNode;
                expect(combinedNode1.containedNodes.map(n => n.name)).toEqual(
                    expect.arrayContaining(['sample 3', 'sample 6'])
                );

                const combinedNodes = graph.getCombinedNodes();
                expect(combinedNodes.length).toBe(2);

                const combinedNode2 = combinedNodes[0].id == combinedNode1Id ? combinedNodes[1] : combinedNodes[0];
                expect(combinedNode2.containedNodes.map(n => n.name)).toEqual(
                    expect.arrayContaining(['sample 7', 'sample 8'])
                );
            });

            test('fullScreenSampleLineage lineage with specific generations and children clustering', () => {
                const graph = fullScreenSampleLineage.generateGraph({
                    filters: [new LineageFilter('type', ['Sample'])],
                    filterIn: true,
                    grouping: {
                        childDepth: 1,
                        combineSize: 2,
                        generations: LINEAGE_GROUPING_GENERATIONS.Specific,
                        parentDepth: 2,
                    },
                });
                expect(graph.nodes.length).toBe(4);

                const ids = graph.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['sample2', 'sample4', 'sample5']));
                expect(ids).toEqual(
                    expect.not.arrayContaining([
                        'sample0',
                        'sample1',
                        'sample3',
                        'sample6',
                        'sample7',
                        'sample8',
                        'run1',
                        'run2',
                        'run3',
                        'run4',
                        'run42',
                        'run5',
                        'run7',
                        'run8',
                    ])
                );

                const combinedNodes = graph.getCombinedNodes();
                expect(combinedNodes.length).toBe(1);
                expect(combinedNodes[0].containedNodes.map(n => n.name)).toEqual(
                    expect.arrayContaining(['sample 3', 'sample 6'])
                );
            });
        });
    });

    describe('collapsed nodes', () => {
        function verifyCollapsedNodesTest(graph) {
            expect(graph.nodes.length).toBe(4);
            expect(graph.edges.length).toBe(4);

            const ids = graph.nodes.getIds();
            expect(ids).toEqual(expect.arrayContaining(['S1', 'R1', 'R2']));
            expect(ids).toEqual(expect.not.arrayContaining(['S2', 'S3', 'S4']));

            const combinedNodes = graph.getCombinedNodes();
            expect(combinedNodes.length).toBe(1);
            const combinedNode = combinedNodes[0];
            const containedNodes = combinedNode.containedNodes.map(n => n.name);
            expect(containedNodes).toEqual(expect.arrayContaining(['S2', 'S3', 'S4']));

            // verify combined node edges
            const edgesFromR1 = graph.edges.get({ filter: (edge: Edge) => edge.from === 'R1' });
            expect(edgesFromR1.length).toBe(1);
            expect(edgesFromR1[0].to).toBe(combinedNode.id);

            const edgesFromR2 = graph.edges.get({ filter: (edge: Edge) => edge.from === 'R2' });
            expect(edgesFromR2.length).toBe(1);
            expect(edgesFromR2[0].to).toBe(combinedNode.id);

            const edgesToCombined = graph.edges.get({ filter: (edge: Edge) => edge.to === combinedNode.id });
            expect(edgesToCombined.length).toBe(2);
            expect(edgesToCombined.map(e => e.from)).toEqual(expect.arrayContaining(['R1', 'R2']));

            const edgesFromCombined = graph.edges.get({ filter: (edge: Edge) => edge.from === combinedNode.id });
            expect(edgesFromCombined.length).toBe(0);
        }

        test('edge to an existing node (R1->S2) will be moved to the collapsed node (S2+S3+S4)', () => {
            // source lineage:
            //        S1
            //       /  \
            //     R1    R2
            //       \  / | \
            //        S2 S3 S4
            //
            // resulting graph: seed=S1, combineSize=3
            //
            //       *S1*
            //       /  \
            //     R1    R2
            //      \    /
            //    (S2+S3+S4)
            //
            const lineageResult = LineageResult.create({ nodes: collapsedNodesTest1, seed: 'S1' });
            const lineage = new Lineage({
                result: lineageResult,
                resultLoadingState: LoadingState.LOADED,
            });
            const graph = lineage.generateGraph({
                grouping: { combineSize: 3 },
            });

            verifyCollapsedNodesTest(graph);
        });

        test('edge will be added from R2 to existing collapsed node (S2+S3+S4)', () => {
            // source lineage:
            //        S1
            //       /  \
            //     R1    R2
            //   / | \  /
            //  S2 S3 S4
            //
            // resulting graph: seed=S1, combineSize=3
            //
            //       *S1*
            //       /  \
            //     R1    R2
            //      \    /
            //    (S2+S3+S4)
            //
            const lineageResult = LineageResult.create({ nodes: collapsedNodesTest2, seed: 'S1' });
            const lineage = new Lineage({
                result: lineageResult,
                resultLoadingState: LoadingState.LOADED,
            });
            const graph = lineage.generateGraph({
                grouping: { combineSize: 3 },
            });

            verifyCollapsedNodesTest(graph);
        });

        // covers two scenarios that are not easily separated
        test(
            'S4 in existing collapsed node (S2+S3+S4) is added to second collapsed node (S4+S5+S6);' +
                'edge to R3 is linked to the collapsed nodes',
            () => {
                // source lineage:
                //                  S1
                //                /    \
                //              R1      R2
                //            / | \    / | \
                //           S2 S3  S4  S5 S6
                //                  |
                //                  R3
                //
                // resulting graph: seed=S1, combineSize=3
                //
                //                 *S1*
                //                /    \
                //              R1      R2
                //              |  \  /  |
                //              |   \/   |
                //              |  /  \  |
                //         (S2+S3+S4) (S4+S5+S6)
                //                 \  /
                //                  R3

                const lineageResult = LineageResult.create({ nodes: collapsedNodesTest3, seed: 'S1' });
                const lineage = new Lineage({
                    result: lineageResult,
                    resultLoadingState: LoadingState.LOADED,
                });
                const graph = lineage.generateGraph({
                    grouping: { combineSize: 3 },
                });

                expect(graph.nodes.length).toBe(6);
                expect(graph.edges.length).toBe(8);

                const ids = graph.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['S1', 'R1', 'R2', 'R3']));
                expect(ids).toEqual(expect.not.arrayContaining(['S2', 'S3', 'S4', 'S5', 'S6']));

                const combinedNodes = graph.getCombinedNodes();
                expect(combinedNodes.length).toBe(2);
                const combinedNodeIds = combinedNodes.map(n => n.id);

                // R1 should connect to both combined nodes
                const edgesFromR1 = graph.edges.get({
                    filter: (edge: Edge) => edge.from === 'R1',
                });
                expect(edgesFromR1.length).toBe(2);
                expect(edgesFromR1.map(e => e.to)).toEqual(expect.arrayContaining(combinedNodeIds));

                // R2 should connect to both combined nodes
                const edgesFromR2 = graph.edges.get({
                    filter: (edge: Edge) => edge.from === 'R2',
                });
                expect(edgesFromR2.length).toBe(2);
                expect(edgesFromR2.map(e => e.to)).toEqual(expect.arrayContaining(combinedNodeIds));

                // combined nodes should both have edges to R3
                combinedNodes.forEach(combinedNode => {
                    const edgesFromCombined = graph.edges.get({
                        filter: (edge: Edge) => edge.from === combinedNode.id,
                    });
                    expect(edgesFromCombined.length).toBe(1);
                    expect(edgesFromCombined.map(e => e.to)).toEqual(expect.arrayContaining(['R3']));

                    // verify contents
                    const containedNodes = combinedNode.containedNodes.map(n => n.name);
                    const expectedContents =
                        containedNodes.indexOf('S2') !== -1 ? ['S2', 'S3', 'S4'] : ['S4', 'S5', 'S6'];
                    expect(containedNodes).toEqual(expect.arrayContaining(expectedContents));
                });
            }
        );
    });

    describe('LineageResult', () => {
        describe('#filterIn()', () => {
            let result: LineageResult;

            test('Should throw on undefined field', () => {
                expect(() => {
                    result = ESLineageResult.filterIn(undefined, undefined);
                }).toThrow('field must not be undefined');
            });

            test('Should filter all on property that does not exist', () => {
                result = ESLineageResult.filterIn('nonExistentField', '123');
                expect(result.nodes.size).toBe(0);
            });

            test('Should filter all on an empty value Array (same as undefined)', () => {
                result = ESLineageResult.filterIn('type', []);
                expect(result.nodes.size).toBe(0);
            });

            test('Should filter value primitive/Array', () => {
                result = ESLineageResult.filterIn('type', 'Data');
                const resultArr = ESLineageResult.filterIn('type', ['Data']);

                expect(result.nodes.size).toBe(1);
                expect(result.nodes.first().type).toBe('Data');
                expect(resultArr.nodes.size).toBe(1);
                expect(resultArr.nodes.first().type).toBe('Data');

                // should be the same node
                expect(resultArr.nodes.first().id).toBe(result.nodes.first().id);
            });

            test('Should maintain heritage', () => {
                const value = ['Data', 'Run']; // TODO: Consider testing just 'Data' and 'Sample'
                result = ESLineageResult.filterIn('type', value);

                expect(result.nodes.size).toBe(3);

                // seed should be a part of the result
                expect(result.nodes.has(ESLineageResult.seed)).toBe(true);

                // seed should continue to not have parents
                expect(result.nodes.get(ESLineageResult.seed).parents.size).toBe(0);

                // seed should maintain "Run" children
                expect(result.nodes.get(ESLineageResult.seed).children.size).toBe(2);

                let filtered = true;
                result.nodes.forEach(node => {
                    if (value.indexOf(node.type) > -1) {
                        return;
                    }
                    filtered = false;
                    return false;
                });

                // filter just these types
                expect(filtered).toBe(true);
            });
        });

        describe('#filterOut()', () => {
            test('Should filter all on undefined field/value', () => {
                expect(() => {
                    const result = ESLineageResult.filterOut(undefined, undefined);
                }).toThrow('field must not be undefined');
            });

            test('Should include nodes when filtering out based on property that does not exist', () => {
                const result = ESLineageResult.filterOut('nonExistentField', '123');
                expect(result.nodes.size).toBe(4);
            });

            test('Should include nodes when filtering by empty value Array', () => {
                const result = ESLineageResult.filterOut('type', []);
                expect(result.nodes.size).toBe(4);
            });

            test('Should filter value primitive/Array', () => {
                const result = ESLineageResult.filterOut('type', 'Data');

                expect(result.nodes.size).toBe(3);
                expect(result.nodes.map(n => n.name).toArray()).toEqual(
                    expect.arrayContaining(['run1', 'run2', 'Derived sample'])
                );
            });
        });
    });

    describe('VisGraphGenerator', () => {
        describe('#generate()', () => {
            // test given the ESLineageResult and no Grouping Options.
            // will render standard non hierarchical graph with no options object
            test('Should generate graph of the complete result', () => {
                const visGraphOptions = generate(ESLineageResult);
                expect(visGraphOptions.nodes.length).toBe(ESLineageResult.nodes.size);
            });

            // test given the unfiltered LineageResult and default Grouping Options:
            // generations = 'all'
            test('Should generate graph with default LineageGroupingOptions', () => {
                const visGraphOptions = generate(ESLineageResult);
                expect(visGraphOptions.nodes.length).toBe(ESLineageResult.nodes.size);
            });

            // test generate using ESLineageResult and Grouping Options of:
            // generations = 'nearest'
            test('Should generate graph with seeds nearest generations', () => {
                const visGraphOptions = generate(ESLineageResult, {
                    grouping: {
                        generations: LINEAGE_GROUPING_GENERATIONS.Nearest,
                    },
                });
                expect(visGraphOptions.nodes.length).toBe(3);
                expect(visGraphOptions.edges.length).toBe(2);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['expression1', 'run1', 'run2']));
                expect(ids).toEqual(expect.not.arrayContaining(['child1']));
            });

            // test generate using sampleLineageResult and Grouping Options of:
            // generations = 'nearest'
            test('Should generate graph with seeds nearest generations', () => {
                const visGraphOptions = generate(sampleLineageResult, {
                    grouping: {
                        generations: LINEAGE_GROUPING_GENERATIONS.Nearest,
                    },
                });
                expect(visGraphOptions.nodes.length).toBe(2);
                expect(visGraphOptions.edges.length).toBe(1);

                const ids = visGraphOptions.nodes.getIds();
                expect(ids).toEqual(expect.arrayContaining(['child1', 'run1']));
                expect(ids).toEqual(expect.not.arrayContaining(['run2', 'expression1']));
            });

            // test generate using empty LineageResult and default Grouping Options
            test('Should generate empty graph', () => {
                const visGraphOptions = generate(
                    LineageResult.create({
                        nodes: {},
                    })
                );
                expect(visGraphOptions.nodes.length).toBe(0);
            });
        });
    });
});
