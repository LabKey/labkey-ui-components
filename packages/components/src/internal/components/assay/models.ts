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
import { List, Map, OrderedMap, Record } from 'immutable';
import { AssayDOM } from '@labkey/api';

import { getEditorModel } from '../../global';
import { QueryInfo } from '../base/models/QueryInfo';
import { AssayDefinitionModel, AssayUploadTabs, QueryColumn, QueryGridModel } from '../base/models/model';
import { FileAttachmentFormModel } from '../files/models';
import { AppURL } from '../../url/AppURL';
import { generateNameWithTimestamp } from '../../util/Date';
import { AssayProtocolModel } from '../../../index';

export interface AssayPropertiesPanelProps {
    model: AssayWizardModel;
    onChange: Function;
    title?: string;
}

export class AssayWizardModel
    extends Record({
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
        usePreviousRunFile: false,
        runColumns: OrderedMap<string, QueryColumn>(),
        runId: undefined,
        runProperties: Map<string, any>(),
        runName: undefined,
        comment: undefined,
        dataText: undefined,
        queryInfo: undefined,
        toDelete: undefined,
        selectedSamples: undefined,
    })
    implements FileAttachmentFormModel {
    assayDef: AssayDefinitionModel;
    isError?: boolean;
    isInit: boolean;
    isLoading: boolean;
    isWarning?: boolean;
    batchId?: number;
    lastRunId?: number;
    returnURL?: AppURL;
    isSubmitted?: boolean;
    isSubmitting?: boolean;
    errorMsg?: React.ReactNode;

    attachedFiles: Map<string, File>;
    batchColumns: OrderedMap<string, QueryColumn>;
    batchProperties: Map<string, any>;
    usePreviousRunFile: boolean;
    runColumns: OrderedMap<string, QueryColumn>;
    runId?: string;
    runProperties?: Map<string, any>;
    runName?: string;
    comment?: string;
    dataText: string;
    queryInfo: QueryInfo;
    toDelete?: string;
    selectedSamples?: Map<string, any>;

    isFilesTab(currentStep: AssayUploadTabs): boolean {
        return currentStep === AssayUploadTabs.Files;
    }

    isCopyTab(currentStep: AssayUploadTabs): boolean {
        return currentStep === AssayUploadTabs.Copy;
    }

    isGridTab(currentStep: AssayUploadTabs): boolean {
        return currentStep === AssayUploadTabs.Grid;
    }

    getAttachedFiles(): List<File> {
        return this.attachedFiles.valueSeq().toList();
    }

    getRunName(currentStep: AssayUploadTabs): string {
        if (this.runName) {
            return this.runName;
        }

        if (this.isFilesTab(currentStep)) {
            // Issue 39328: set assay run to 'undefined' so that the server will fill it in based on the file name
            // note that in the "file already exists so it will be renamed" case, that renamed file name will be used.
            const file = this.getAttachedFiles().first();
            if (file || this.usePreviousRunFile) {
                return undefined;
            }
        }

        return generateNameWithTimestamp(this.assayDef.name);
    }

    hasData(currentStep: number, gridModel: QueryGridModel): boolean {
        if (this.isFilesTab(currentStep)) {
            if (!this.attachedFiles.isEmpty()) {
                return true;
            }
            if (this.runId && this.usePreviousRunFile) {
                return true;
            }
        } else if (this.isCopyTab(currentStep)) {
            return this.dataText !== undefined;
        } else if (this.isGridTab(currentStep)) {
            // TODO add a dirty flag to the editorModel
            // const editorModel = getEditorModel(gridModel.getId());
            // return editorModel.hasData();
            return true;
        }
        return false;
    }

    prepareFormData(currentStep: number, gridModel: QueryGridModel): IAssayUploadOptions {
        const {
            batchId,
            batchProperties,
            comment,
            dataText,
            assayDef,
            runProperties,
            runId,
            usePreviousRunFile,
        } = this;

        const assayData: any = {
            assayId: assayDef.id,
            batchId,
            batchProperties: batchProperties.toObject(),
            comment,
            name: this.getRunName(currentStep),
            properties: runProperties.toObject(),
            reRunId: runId,
            saveDataAsFile: true,
        };

        Object.keys(assayData).forEach(k => {
            if (assayData[k] === undefined) {
                delete assayData[k];
            }
        });

        if (this.isFilesTab(currentStep)) {
            assayData.files = this.getAttachedFiles().toArray();
            if (runId !== undefined && usePreviousRunFile && assayData.files.length === 0) {
                const url = runProperties.get('DataOutputs/DataFileUrl');
                if (url) {
                    const filesIndex = url.indexOf('@files');
                    // get past the @files and the trailing slash
                    assayData.runFilePath = url.substring(filesIndex + 7);
                }
            }
        } else if (this.isCopyTab(currentStep)) {
            assayData.dataRows = parseDataTextToRunRows(dataText);
        } else if (this.isGridTab(currentStep)) {
            // need to get the EditorModel for the data to use in the import
            const editorModel = getEditorModel(gridModel.getId());

            assayData.dataRows = editorModel
                .getRawData(gridModel)
                .valueSeq()
                .map(row => row.filter(v => v !== undefined && v !== null && ('' + v).trim() !== ''))
                .toList()
                .toJS();
        } else {
            throw new Error('Unsupported upload step! Current step: "' + currentStep + '"');
        }

        // remove the "DataOutputs/DataFileUrl" from properties as it causes failures in AssayRunUploadContextImpl.addVocabularyProperties()
        if (assayData.properties['DataOutputs/DataFileUrl']) {
            delete assayData.properties['DataOutputs/DataFileUrl'];
        }

        return assayData;
    }
}

export interface IAssayUploadOptions extends AssayDOM.IImportRunOptions {
    dataRows?: any; // Array<any> | QueryGridModel
}

// exported for jest testing
export function parseDataTextToRunRows(rawData: string): any[] {
    if (!rawData || !rawData.length) {
        return null;
    }

    const rows = [];
    let columns = [];

    rawData
        .split('\n')
        .filter(row => row.trim().length > 0)
        .forEach(row => {
            const parts = row.split('\t');
            if (parts.length === 0) return;

            if (columns.length === 0) columns = parts;
            else {
                const row = {};
                parts.forEach((part, index) => {
                    if (part.trim() !== '') {
                        row[columns[index]] = part;
                    }
                });
                rows.push(row);
            }
        });

    return rows.length > 0 ? rows : null;
}

export class AssayUploadResultModel extends Record({
    assayId: undefined,
    batchId: undefined,
    runId: undefined,
    success: undefined,
    successurl: undefined,
}) {
    assayId: number;
    batchId: number;
    runId: number;
    success: boolean;
    successurl?: string;
}

export class AssayStateModel extends Record({
    byId: Map<number, AssayDefinitionModel>(),
    byName: Map<string, number>(),
    errorMsg: undefined,
    hasError: false,
    isLoaded: false,
    isLoading: false,
    protocolsById: Map<number, AssayProtocolModel>(),
}) {
    byId: Map<number, AssayDefinitionModel>;
    byName: Map<string, number>;
    errorMsg: string;
    hasError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    protocolsById: Map<number, AssayProtocolModel>;

    getById(assayRowId: number): AssayDefinitionModel {
        return this.byId.get(assayRowId);
    }

    getByName(assayName: string): AssayDefinitionModel {
        if (assayName) {
            const assayRowId = this.byName.get(assayName.toLowerCase());
            if (assayRowId !== undefined) {
                return this.byId.get(assayRowId);
            }
        }
    }

    getProtocol(assayRowId: number): AssayProtocolModel {
        return this.protocolsById.get(assayRowId);
    }
}
