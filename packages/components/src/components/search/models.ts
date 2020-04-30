/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS, List, Map, Record } from 'immutable';

export class SearchResultsModel extends Record({
    entities: undefined,
    error: undefined,
    isLoading: false,
    isLoaded: false,
    lastUpdate: undefined,
}) {
    entities: List<Map<any, any>>;
    error: string;
    isLoading: boolean;
    isLoaded: boolean;
    lastUpdate: Date;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

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
    iconSrc?: string;
    altText?: string;
    title?: string;
    typeName?: string;
}
