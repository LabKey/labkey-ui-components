/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    LineageGroupingOptions,
    LINEAGE_DIRECTIONS,
    LINEAGE_GROUPING_GENERATIONS,
    LineageOptions,
    LineageURLResolvers,
} from './types';

// Default depth to fetch with the lineage API
export const DEFAULT_LINEAGE_DISTANCE = 3;
export const DEFAULT_LINEAGE_DIRECTION = LINEAGE_DIRECTIONS.Children;

export const DEFAULT_GROUPING_OPTIONS: LineageGroupingOptions = {
    childDepth: DEFAULT_LINEAGE_DISTANCE,
    combineSize: 6,
    generations: LINEAGE_GROUPING_GENERATIONS.All,
    parentDepth: DEFAULT_LINEAGE_DISTANCE + 1,
};

export const DEFAULT_LINEAGE_OPTIONS: LineageOptions = {
    filterIn: true,
    filters: [],
    grouping: DEFAULT_GROUPING_OPTIONS,
    urlResolver: LineageURLResolvers.App,
};
