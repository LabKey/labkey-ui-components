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
import { Map } from 'immutable';

import { AssayWizardModel } from "../../components/assay/models";
import assayWizardJSON from './assayWizardModel.json';
import { AssayDefinitionModel, AssayDomainTypes, QueryInfo } from '../../components/base/models/model';

export const GRID_DATA = Map<any, Map<string, any>>({
    "1": Map<string, any>({
    GRID_EDIT_INDEX: 1,
    "rowid": "1",
    "Name": "name one",
    "Description": "first description"
}),
    "2": Map<any, Map<string, any>>({
    GRID_EDIT_INDEX: 2,
    "rowid": "2",
    "Name": "name two",
    "Description": "second description"
})
});

export const ASSAY_DEFINITION_MODEL = AssayDefinitionModel.create(assayWizardJSON.assayDef);
export const ASSAY_WIZARD_MODEL = new AssayWizardModel({
    isInit: true,
    assayDef: ASSAY_DEFINITION_MODEL,
    batchColumns: ASSAY_DEFINITION_MODEL.getDomainColumns(AssayDomainTypes.BATCH),
    runColumns: ASSAY_DEFINITION_MODEL.getDomainColumns(AssayDomainTypes.RUN),
    queryInfo: QueryInfo.create(assayWizardJSON.queryInfo)
});
