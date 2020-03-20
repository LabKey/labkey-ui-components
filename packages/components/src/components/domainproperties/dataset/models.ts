/*
 * Copyright (c) 2020 LabKey Corporation
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

import {Record} from "immutable";
import {DomainDesign} from "../models";

export interface AdvancedSettingsForm {
    titleColumn?: string;
    discussionSetting?: number;
    fileAttachmentIndex?: boolean;
    entireListIndex?: boolean;
    entireListTitleTemplate?: string;
    entireListIndexSetting?: number;
    entireListBodySetting?: number;
    eachItemIndex?: boolean;
    eachItemTitleTemplate?: string;
    eachItemBodySetting?: number;
    entireListBodyTemplate?: string;
    eachItemBodyTemplate?: string;
}

export class DatasetModel extends Record({
    datasetId: undefined,
    name: undefined,
    typeURI: undefined,
    category: undefined,
    visitDatePropertyName: undefined,
    keyProperty: undefined,
    isDemographicData: undefined,
    label: undefined,
    cohortId: undefined,
    tag: undefined,
    showByDefault: undefined,
    description: undefined,
    sourceAssayName: undefined,
    sourceAssayURL: undefined,
    dataSharing: undefined
}) {
    datasetId: number;
    name: string;
    typeURI?: string;
    category?: string;
    visitDatePropertyName?: string;
    keyProperty?: string;
    isDemographicData?: boolean;
    label?: string;
    cohortId?: number;
    tag?: string;
    showByDefault?: boolean;
    description?: string;
    sourceAssayName?: string;
    sourceAssayURL?: string;
    dataSharing?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(newDataset=null): DatasetModel {
        if (newDataset) {
            let domain = DomainDesign.create(undefined);
            return new DatasetModel({...newDataset, domain});
        }
    }
}
