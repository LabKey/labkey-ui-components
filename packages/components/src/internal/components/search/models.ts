/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, List, Map, Record } from 'immutable';
import { Filter } from '@labkey/api';

import { JsonType } from '../domainproperties/PropDescType';

import { SearchCategory } from './constants';

export class SearchResultsModel extends Record({
    entities: undefined,
    error: undefined,
    isLoading: false,
    isLoaded: false,
    lastUpdate: undefined,
}) {
    declare entities: List<Map<any, any>>;
    declare error: string;
    declare isLoading: boolean;
    declare isLoaded: boolean;
    declare lastUpdate: Date;

    static create(raw: any): SearchResultsModel {
        return new SearchResultsModel({
            ...raw,
            entities: raw.entities ? fromJS(raw.entities) : undefined,
        });
    }
}

export class SearchIdData {
    group: string;
    id: string;
    type: string;
}

export interface SearchResultCardData {
    altText?: string;
    category?: string;
    iconDir?: string;
    iconSrc?: string;
    title?: string;
    typeName?: string;
}

export interface EntityFieldFilter {
    fieldCaption: string;
    fieldKey: string;
    filter: Filter.IFilter;
    jsonType: JsonType;
}

export interface FieldFilterOption {
    betweenOperator: boolean;
    isSoleFilter: boolean;
    label: string;
    multiValue: boolean;
    value: string;
    valueRequired: boolean;
}

export interface FilterSelection {
    filterType: FieldFilterOption;
    firstFilterValue?: any;
    secondFilterValue?: any;
}

export type GetCardDataFn = (data: Map<any, any>, category?: SearchCategory) => SearchResultCardData;
