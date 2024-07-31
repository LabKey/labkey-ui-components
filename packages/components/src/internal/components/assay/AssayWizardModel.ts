import { Map, OrderedMap, Record } from 'immutable';
import { AssayDOM } from '@labkey/api';

import { AssayUploadTabs } from '../../constants';
import { generateNameWithTimestamp } from '../../util/Date';
import { initEditorModel } from '../editable/actions';
import { QueryColumn } from '../../../public/QueryColumn';
import { AssayDefinitionModel, AssayDomainTypes } from '../../AssayDefinitionModel';
import { FileAttachmentFormModel } from '../files/models';
import { AppURL } from '../../url/AppURL';
import { QueryInfo } from '../../../public/QueryInfo';
import { EditableGridLoader, EditorMode, EditorModel, GridResponse } from '../editable/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

class AssayWizardModelEditableGridLoader implements EditableGridLoader {
    columns: QueryColumn[];
    id: string;
    mode: EditorMode;
    queryInfo: QueryInfo;
    data: Map<string, Map<string, any>>;

    constructor(queryInfo: QueryInfo, data: Map<string, Map<string, any>>) {
        this.mode = EditorMode.Insert;
        this.queryInfo = queryInfo;
        this.data = data;
    }

    async fetch(model: QueryModel): Promise<GridResponse> {
        return {
            data: this.data,
            dataIds: this.data.keySeq().toList(),
        };
    }
}

export interface AssayUploadOptions extends AssayDOM.ImportRunOptions {
    dataRows?: any; // Array<any>
    maxFileSize?: number;
    maxRowCount?: number;
    resultsFiles?: File[];
}

export class AssayWizardModel
    extends Record({
        assayDef: undefined,
        isWarning: false,
        isInit: false,
        isLoading: false,
        batchId: undefined, // batchId is null for first run
        lastRunId: undefined,
        returnUrl: undefined,
        isSubmitted: undefined,
        isSubmitting: undefined,

        attachedFiles: Map<string, File>(),
        resultsFiles: Map<string, File>(),
        batchColumns: OrderedMap<string, QueryColumn>(),
        batchProperties: Map<string, any>(),
        comment: undefined,
        dataText: undefined,
        plateColumns: OrderedMap<string, QueryColumn>(),
        plateProperties: Map<string, any>(),
        runColumns: OrderedMap<string, QueryColumn>(),
        runId: undefined,
        runProperties: Map<string, any>(),
        runName: undefined,
        queryInfo: undefined,
        selectedSamples: undefined,
        toDelete: undefined,
        usePreviousRunFile: false,

        jobDescription: undefined,
        jobNotificationProvider: undefined,
        forceAsync: false,
        workflowTask: undefined,
    })
    implements FileAttachmentFormModel
{
    declare assayDef: AssayDefinitionModel;
    declare isInit: boolean;
    declare isLoading: boolean;
    declare isWarning?: boolean;
    declare batchId?: number;
    declare lastRunId?: number;
    declare returnUrl?: AppURL;
    declare isSubmitted?: boolean;
    declare isSubmitting?: boolean;

    declare attachedFiles: Map<string, File>;
    declare resultsFiles: Map<string, File>;
    declare batchColumns: OrderedMap<string, QueryColumn>;
    declare batchProperties: Map<string, any>;
    declare usePreviousRunFile: boolean;
    declare plateColumns: OrderedMap<string, QueryColumn>;
    declare plateProperties?: Map<string, any>;
    declare runColumns: OrderedMap<string, QueryColumn>;
    declare runId?: string;
    declare runProperties?: Map<string, any>;
    declare runName?: string;
    declare comment?: string;
    declare dataText: string;
    declare queryInfo: QueryInfo;
    declare toDelete?: string;
    declare selectedSamples?: Map<string, any>;

    declare jobDescription?: string;
    declare jobNotificationProvider?: string;
    declare forceAsync?: boolean;
    declare workflowTask?: number;

    isFilesTab(currentStep: AssayUploadTabs): boolean {
        return currentStep === AssayUploadTabs.Files;
    }

    isGridTab(currentStep: AssayUploadTabs): boolean {
        return currentStep === AssayUploadTabs.Grid;
    }

    getAttachedFiles(): File[] {
        return this.attachedFiles.valueSeq().toArray();
    }

    getTotalAttachedFilesSize(): number {
        return this.attachedFiles.reduce((totalSize, file) => totalSize + file.size, 0);
    }

    getResultsFiles(): File[] {
        return this.resultsFiles.valueSeq().toArray();
    }

    getTotalResultsFilesSize(): number {
        return this.resultsFiles.reduce((totalSize, file) => totalSize + file.size, 0);
    }

    getRunName(currentStep: AssayUploadTabs): string {
        if (this.runName) {
            return this.runName;
        }

        if (this.isFilesTab(currentStep)) {
            // Issue 39328: set assay run to 'undefined' so that the server will fill it in based on the file name
            // note that in the "file already exists so it will be renamed" case, that renamed file name will be used.
            const file = this.getAttachedFiles()[0];
            if (file || this.usePreviousRunFile) {
                return undefined;
            }
        }

        return generateNameWithTimestamp(this.assayDef.name);
    }

    hasData(currentStep: number, editorModel?: EditorModel): boolean {
        if (this.isFilesTab(currentStep)) {
            if (!this.attachedFiles.isEmpty()) {
                return true;
            }
            if (this.runId && this.usePreviousRunFile) {
                return true;
            }
        } else if (this.isGridTab(currentStep)) {
            return editorModel.hasData;
        }
        return false;
    }

    prepareFormData(currentStep: number, editorModel: EditorModel, queryModel: QueryModel): AssayUploadOptions {
        const {
            batchId,
            batchProperties,
            comment,
            assayDef,
            runProperties,
            runId,
            usePreviousRunFile,
            jobDescription,
            jobNotificationProvider,
            forceAsync,
            workflowTask,
        } = this;

        const assayData: AssayUploadOptions = {
            assayId: assayDef.id,
            batchId,
            batchProperties: batchProperties.toObject(),
            comment,
            name: this.getRunName(currentStep),
            properties: runProperties.toObject(),
            reRunId: runId,
            saveDataAsFile: true,
            jobDescription,
            jobNotificationProvider,
            forceAsync,
            workflowTask,
        };

        Object.keys(assayData).forEach(k => {
            if (assayData[k] === undefined) {
                delete assayData[k];
            }
        });

        if (this.isFilesTab(currentStep)) {
            assayData.files = this.getAttachedFiles();
            assayData.resultsFiles = this.getResultsFiles();
            if (runId !== undefined && usePreviousRunFile && assayData.files.length === 0) {
                const url = runProperties.get('DataOutputs/DataFileUrl');
                if (url) {
                    const filesIndex = url.indexOf('@files');
                    // get past the @files and the trailing slash
                    assayData.runFilePath = url.substring(filesIndex + 7);

                    if (assayData.runFilePath.toLowerCase().endsWith('.tmp')) {
                        // Issue 47509: if the original run was imported via the editable grid,
                        // the sample Ids will be rowIds so set allowLookupByAlternateKey to false
                        assayData.allowLookupByAlternateKey = false;
                    }
                }
            }
        } else if (this.isGridTab(currentStep)) {
            // need to get the EditorModel for the data to use in the import
            assayData.dataRows = editorModel
                .getDataForServerUpload(false)
                .valueSeq()
                .map(row => row.filter(v => v !== undefined && v !== null && ('' + v).trim() !== ''))
                .toList()
                .toJS();

            // Issue 47509: the editable grid will always use key values (i.e. RowIds) for lookups, so set allowLookupByAlternateKey to false
            assayData.allowLookupByAlternateKey = false;
        } else {
            throw new Error('Unsupported upload step! Current step: "' + currentStep + '"');
        }

        // remove the "DataOutputs/DataFileUrl" from properties as it causes failures in AssayRunUploadContextImpl.addVocabularyProperties()
        if (assayData.properties['DataOutputs/DataFileUrl']) {
            delete assayData.properties['DataOutputs/DataFileUrl'];
        }

        return assayData;
    }

    /**
     * This method instantiates the initial data used in the editable grid during assay upload, it includes data for
     * an EditorModel and QueryModel.
     */
    async getInitialGridData(): Promise<{ editorModel: Partial<EditorModel>; queryModel: Partial<QueryModel> }> {
        const { assayDef, selectedSamples } = this;
        const sampleColumnData = assayDef.getSampleColumn();
        const sampleColInResults = sampleColumnData && sampleColumnData.domain === AssayDomainTypes.RESULT;
        const hasSamples = sampleColInResults && selectedSamples;
        // We only care about passing samples to the data grid if there is a sample column in the results domain.
        const rows = hasSamples ? selectedSamples : Map<string, Map<string, any>>({});
        const loader = new AssayWizardModelEditableGridLoader(this.queryInfo, rows);
        const dataModel = new QueryModel({ schemaQuery: this.queryInfo.schemaQuery }).mutate({ queryInfo: this.queryInfo });
        const editorModel = await initEditorModel(dataModel, loader);
        // TODO: don't return dataModel, as it's not really needed.
        return { editorModel, queryModel: dataModel };
    }
}
