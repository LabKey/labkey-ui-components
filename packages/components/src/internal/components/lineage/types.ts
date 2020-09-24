/*
 * Copyright (c) 2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import { Experiment } from '@labkey/api';

export enum LINEAGE_DIRECTIONS {
    Children = 'children',
    Parent = 'parents',
}

export enum LINEAGE_GROUPING_GENERATIONS {
    /** Include all nodes from the seed available in the lineage response (which has it's own depth option). */
    All = 'all',
    /** Include all nodes from the seed until a depth is found that contains multiple nodes. */
    Multi = 'multi',
    /** Include only the immediately connected nodes from the seed. */
    Nearest = 'nearest',
    /** Include all nodes from the seed up to the {@link LineageGroupingOptions.parentDepth} or {@link LineageGroupingOptions.childDepth} specified. */
    Specific = 'specific',
}

/**
 * After the raw lineage result has been filtered, LineageGroupingOptions determines
 * how many generations of nodes to include in the VisGraph and the threshold at which
 * to combine multiple nodes together.
 */
export interface LineageGroupingOptions {
    /** Determines when to stop traversing generations of nodes. */
    generations?: LINEAGE_GROUPING_GENERATIONS;
    /** When {@link generations} is {@link LINEAGE_GROUPING_GENERATIONS.Specific}, include this many generations along the parent axis. */
    parentDepth?: number;
    /** When {@link generations} is {@link LINEAGE_GROUPING_GENERATIONS.Specific}, include this many generations along the child axis. */
    childDepth?: number;
    /** When the number of parent or children edges is greater than or equal to this threshold, create a combined node. */
    combineSize?: number;
}

export class LineageFilter {
    field: string;
    value: string[];

    constructor(field: string, value: string[]) {
        this.field = field;
        this.value = value;
    }
}

export enum LineageURLResolvers {
    App = 'App',
    Server = 'Server',
}

export interface LineageOptions {
    filterIn?: boolean;
    filters?: LineageFilter[];
    grouping?: LineageGroupingOptions;
    // the Map<string, string> should be keyed off of the queryName for the group title suffix being modified
    groupTitles?: Map<LINEAGE_DIRECTIONS, Map<string, string>>;
    request?: Experiment.ExperimentJSONConverterOptions;
    urlResolver?: LineageURLResolvers;
}

export interface LineageIconMetadata {
    iconURL: string;
    image: string;
    imageBackup: string;
    imageSelected: string;
    imageShape: string;
}

export interface LineageLinkMetadata {
    lineage: string;
    list: string;
    overview: string;
}
