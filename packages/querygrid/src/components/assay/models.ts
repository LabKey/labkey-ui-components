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
import { List, OrderedMap, Map, Record } from 'immutable'
import { AppURL, AssayDefinitionModel, AssayUploadTabs, QueryColumn, QueryInfo, FileAttachmentFormModel } from "@glass/base";

export interface AssayPropertiesPanelProps {
    model: AssayWizardModel
    onChange: Function
}

export interface IAssayURLContext {
    assayRequest?: string
    location?: string
    protocol: string
    provider: string
    runId?: string
}

export class AssayWizardModel extends Record({
    assayDef: undefined,
    isError: undefined,
    isWarning: false,
    isInit: false,
    isLoading: false,
    batchId: undefined, // batchId is null for first run
    lastRunId: undefined,
    returnURL: undefined,
    isSubmitted: undefined,
    isSubmitting: undefined,
    errorMsg: undefined,

    attachedFiles: Map<string, File>(),

    batchColumns: OrderedMap<string, QueryColumn>(),
    batchProperties: Map<string, any>(),
    runColumns: OrderedMap<string, QueryColumn>(),
    runId: undefined,
    runProperties: Map<string, any>(),
    runName: undefined,
    comment: undefined,
    dataText: undefined,
    queryInfo: QueryInfo,
    toDelete: undefined,
    selectedSamples: undefined,
}) implements FileAttachmentFormModel {
    assayDef: AssayDefinitionModel;
    isError?: boolean;
    isInit: boolean;
    isLoading: boolean;
    isWarning?: boolean;
    batchId? : number;
    lastRunId?: number;
    returnURL?: AppURL;
    isSubmitted?: boolean;
    isSubmitting?: boolean;
    errorMsg?: string;

    attachedFiles: Map<string, File>;

    batchColumns: OrderedMap<string, QueryColumn>;
    batchProperties: Map<string, any>;
    runColumns: OrderedMap<string, QueryColumn>;
    runId?: string;
    runProperties?: Map<string, any>;
    runName?: string;
    comment?: string;

    dataText: string;
    queryInfo: QueryInfo;
    toDelete?: string;
    selectedSamples?: Map<string, any>;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    // TODO shouldn't this move to actions.ts? or put just in Biologics somewhere
    static parseURLContext(location: any, params: any): IAssayURLContext {
        const { protocol, provider } = params;

        let context: IAssayURLContext = {
            location,
            protocol,
            provider
        };

        if (location && location.query) {
            const { assayRequest, runId } = location.query;
            context.assayRequest = assayRequest;
            context.runId = runId;
        }

        return context;
    }

    getAttachedFiles(): List<File> {
        return this.attachedFiles.valueSeq().toList();
    }

    getRunName(currentStep: AssayUploadTabs): string {
        if (this.runName) {
            return this.runName;
        }

        if (currentStep === AssayUploadTabs.Files) {
            // using file upload tab
            const file = this.getAttachedFiles().first();
            if (file) {
                return file.name;
            }
        }

        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        let timeStr = date.toTimeString().split(' ')[0];
        timeStr = timeStr.replace(/:/g, '-');
        return this.assayDef.name + '_' + dateStr + '_' + timeStr;
    }
}