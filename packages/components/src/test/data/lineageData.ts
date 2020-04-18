/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

/*
 *       expression1
 *         /     \
 *       run1   run2
 *       /
 *    child1
 */
const lineageSimpleNodes = {
    expression1: {
        children: [
            {
                lsid: 'run2',
                role: 'ES-3',
            },
            {
                lsid: 'run1',
                role: 'ES-3',
            },
        ],
        nearestParentData: false,
        name: 'ES-3',
        cpasType: 'urn:lsid:labkey.com:DataClass.Folder-120:ExpressionSystem',
        type: 'Data',
        url: null,
        parents: [],
        rowId: 1,
    },
    run1: {
        children: [
            {
                lsid: 'child1',
                role: 'ES-3',
            },
        ],
        name: 'run1',
        cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
        type: 'Run',
        url: null,
        parents: [
            {
                lsid: 'expression1',
                role: 'ES-3',
            },
        ],
        rowId: 11,
    },
    run2: {
        children: [],
        name: 'run2',
        cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
        type: 'Run',
        url: null,
        parents: [
            {
                lsid: 'expression1',
                role: 'ES-3',
            },
        ],
        rowId: 12,
    },
    child1: {
        children: [],
        name: 'Derived sample',
        cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
        type: 'Sample',
        url: null,
        parents: [
            {
                lsid: 'run1',
                role: 'ES-3',
            },
        ],
        rowId: 111,
    },
};

// seed = expression1
export const lineageExpressionSystem = {
    nodes: lineageSimpleNodes,
    seed: 'expression1',
};

// seed = child1
export const lineageSample = {
    nodes: lineageSimpleNodes,
    seed: 'child1',
};

/*
 *            sample0
 *               |
 *             run1
 *               |
 *            sample1
 *               |
 *             run2
 *               |
 *            sample2
 *               |
 *             run3
 *               |
 *            sample3    sample6
 *               |       /
 *             run4    run42
 *               |    /
 *           *sample4*
 *               |
 *             run5
 *               |
 *            sample5
 *               |    \
 *             run7    run8
 *               |       \
 *            sample7    sample8
 */
// S0 -> R1 -> S1 -> R2 -> S2 -> R3 -> S3 -> R4  -> *S4* -> R5 -> S5 -> R7 -> S7
//                                     S6 -> R42 -> *S4*             -> R8 -> S8
//
// seed = S4
export const fullScreenLineageSample = {
    nodes: {
        sample0: {
            children: [
                {
                    lsid: 'run1',
                    role: 'ES-3',
                },
            ],
            name: 'sample 0',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [],
            rowId: 0,
        },
        run1: {
            children: [
                {
                    lsid: 'sample1',
                    role: 'ES-3',
                },
            ],
            name: 'Run 1',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample0',
                    role: 'ES-3',
                },
            ],
            rowId: 1,
        },
        sample1: {
            children: [
                {
                    lsid: 'run2',
                    role: 'ES-3',
                },
            ],
            name: 'sample 1',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run1',
                    role: 'ES-3',
                },
            ],
            rowId: 2,
        },
        run2: {
            children: [
                {
                    lsid: 'sample2',
                    role: 'ES-3',
                },
            ],
            name: 'Run 2',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample1',
                    role: 'ES-3',
                },
            ],
            rowId: 3,
        },
        sample2: {
            children: [
                {
                    lsid: 'run3',
                    role: 'ES-3',
                },
            ],
            name: 'sample 2',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run2',
                    role: 'ES-3',
                },
            ],
            rowId: 4,
        },
        run3: {
            children: [
                {
                    lsid: 'sample3',
                    role: 'ES-3',
                },
            ],
            name: 'Run 3',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample2',
                    role: 'ES-3',
                },
            ],
            rowId: 5,
        },
        sample3: {
            children: [
                {
                    lsid: 'run4',
                    role: 'ES-3',
                },
            ],
            name: 'sample 3',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run3',
                    role: 'ES-3',
                },
            ],
            rowId: 6,
        },
        run4: {
            children: [
                {
                    lsid: 'sample4',
                    role: 'ES-3',
                },
            ],
            name: 'Run 4',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample3',
                    role: 'ES-3',
                },
            ],
            rowId: 7,
        },
        sample4: {
            children: [
                {
                    lsid: 'run5',
                    role: 'ES-3',
                },
            ],
            name: 'sample 4',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run4',
                    role: 'ES-3',
                },
                {
                    lsid: 'run42', //
                    role: 'ES-3',
                },
            ],
            rowId: 8,
        },
        run5: {
            children: [
                {
                    lsid: 'sample5',
                    role: 'ES-3',
                },
            ],
            name: 'Run 5',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample4',
                    role: 'ES-3',
                },
            ],
            rowId: 9,
        },
        sample5: {
            children: [
                {
                    lsid: 'run7',
                    role: 'ES-3',
                },
                {
                    lsid: 'run8',
                    role: 'ES-3',
                },
            ],
            name: 'sample 5',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run5',
                    role: 'ES-3',
                },
            ],
            rowId: 10,
        },
        sample6: {
            children: [
                {
                    lsid: 'run42',
                    role: 'ES-3',
                },
            ],
            name: 'sample 6',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [],
            rowId: 11,
        },
        run42: {
            children: [
                {
                    lsid: 'sample4',
                    role: 'ES-3',
                },
            ],
            name: 'Run 42',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample6',
                    role: 'ES-3',
                },
            ],
            rowId: 12,
        },
        run7: {
            children: [
                {
                    lsid: 'sample7',
                    role: 'ES-3',
                },
            ],
            name: 'Run 7',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample5',
                    role: 'ES-3',
                },
            ],
            rowId: 9,
        },
        sample7: {
            children: [],
            name: 'sample 7',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run7',
                    role: 'ES-3',
                },
            ],
            rowId: 13,
        },
        run8: {
            children: [
                {
                    lsid: 'sample8',
                    role: 'ES-3',
                },
            ],
            name: 'Run 8',
            cpasType: 'urn:lsid:labkey.org:Protocol:SampleDerivationProtocol',
            type: 'Run',
            url: null,
            parents: [
                {
                    lsid: 'sample5',
                    role: 'ES-3',
                },
            ],
            rowId: 14,
        },
        sample8: {
            children: [],
            name: 'sample 8',
            cpasType: 'urn:lsid:labkey.com:SampleSet.Folder-120:Samples',
            type: 'Sample',
            url: null,
            parents: [
                {
                    lsid: 'run8',
                    role: 'ES-3',
                },
            ],
            rowId: 15,
        },
    },
    seed: 'sample4',
};

//
//        S1
//       /  \
//     R1    R2
//       \  / | \
//        S2 S3 S4
//
export const collapsedNodesTest1 = {
    S1: {
        name: 'S1',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [],
        children: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
    },
    R1: {
        name: 'R1',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S2',
            },
        ],
    },
    R2: {
        name: 'R2',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S2',
            },
            {
                lsid: 'S3',
            },
            {
                lsid: 'S4',
            },
        ],
    },
    S2: {
        name: 'S2',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
    S3: {
        name: 'S3',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
    S4: {
        name: 'S4',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
};

//
//        S1
//       /  \
//     R1    R2
//   / | \  /
//  S2 S3 S4
//
export const collapsedNodesTest2 = {
    S1: {
        name: 'S1',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [],
        children: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
    },
    R1: {
        name: 'R1',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S2',
            },
            {
                lsid: 'S3',
            },
            {
                lsid: 'S4',
            },
        ],
    },
    R2: {
        name: 'R2',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S4',
            },
        ],
    },
    S2: {
        name: 'S2',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
        ],
        children: [],
    },
    S3: {
        name: 'S3',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
        ],
        children: [],
    },
    S4: {
        name: 'S4',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
};

//
//          S1
//        /    \
//      R1      R2
//    / | \    / | \
//   S2 S3  S4  S5 S6
//          |
//          R3
//
export const collapsedNodesTest3 = {
    S1: {
        name: 'S1',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [],
        children: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
    },
    R1: {
        name: 'R1',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S2',
            },
            {
                lsid: 'S3',
            },
            {
                lsid: 'S4',
            },
        ],
    },
    R2: {
        name: 'R2',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S1',
            },
        ],
        children: [
            {
                lsid: 'S4',
            },
            {
                lsid: 'S5',
            },
            {
                lsid: 'S6',
            },
        ],
    },
    S2: {
        name: 'S2',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
        ],
        children: [],
    },
    S3: {
        name: 'S3',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
        ],
        children: [],
    },
    S4: {
        name: 'S4',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R1',
            },
            {
                lsid: 'R2',
            },
        ],
        children: [
            {
                lsid: 'R3',
            },
        ],
    },
    S5: {
        name: 'S5',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
    S6: {
        name: 'S6',
        cpasType: 'SampleSet:Samples',
        type: 'Sample',
        parents: [
            {
                lsid: 'R2',
            },
        ],
        children: [],
    },
    R3: {
        name: 'R3',
        cpasType: 'Protocol:SampleDerivationProtocol',
        type: 'Run',
        parents: [
            {
                lsid: 'S4',
            },
        ],
        children: [],
    },
};
