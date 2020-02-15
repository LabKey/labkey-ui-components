/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

export enum LINEAGE_DIRECTIONS {
    Children = 'children',
    Parent = 'parents'
}

export enum LINEAGE_GROUPING_GENERATIONS {
    /** Include all nodes from the seed available in the lineage response (which has it's own depth option). */
    All = 'all',
    /** Include all nodes from the seed until a depth is found that contains multiple nodes. */
    Multi = 'multi',
    /** Include only the immediately connected nodes from the seed. */
    Nearest = 'nearest',
    /** Include all nodes from the seed up to the {@link ILineageGroupingOptions.parentDepth} or {@link ILineageGroupingOptions.childDepth} specified. */
    Specific = 'specific'
}

// Default depth to fetch with the lineage API
export const DEFAULT_LINEAGE_DISTANCE = 3;
export const DEFAULT_LINEAGE_DIRECTION = LINEAGE_DIRECTIONS.Children;
