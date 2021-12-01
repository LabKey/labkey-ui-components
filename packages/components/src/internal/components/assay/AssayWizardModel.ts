import { fromJS, List, Map, OrderedMap, Record, Set } from 'immutable';
import { AssayDOM, Utils } from '@labkey/api';

import {
    AppURL,
    AssayDefinitionModel,
    AssayDomainTypes,
    EditorModel,
    FileAttachmentFormModel,
    QueryColumn,
    QueryInfo,
    QueryModel,
} from '../../..';
import { genCellKey, getLookupDisplayValue } from '../../actions';
import { AssayUploadTabs } from '../../constants';
import { getLookupStore } from '../../global';
import { ValueDescriptor } from '../../models';
import { generateNameWithTimestamp } from '../../util/Date';

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

export interface IAssayUploadOptions extends AssayDOM.IImportRunOptions {
    dataRows?: any; // Array<any> | QueryGridModel
    maxFileSize?: number;
    maxRowCount?: number;
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
    declare batchColumns: OrderedMap<string, QueryColumn>;
    declare batchProperties: Map<string, any>;
    declare usePreviousRunFile: boolean;
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

    hasData(currentStep: number): boolean {
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

    prepareFormData(currentStep: number, editorModel: EditorModel, queryModel: QueryModel): IAssayUploadOptions {
        const {
            batchId,
            batchProperties,
            comment,
            dataText,
            assayDef,
            runProperties,
            runId,
            usePreviousRunFile,
            jobDescription,
            jobNotificationProvider,
            forceAsync,
            workflowTask,
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
            assayData.dataRows = editorModel
                .getRawDataFromGridData(fromJS(queryModel.rows), fromJS(queryModel.orderedRows), queryModel.queryInfo)
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

    getInitialQueryModelData(): { rows: { [key: string]: any }; orderedRows: string[] } {
        const { assayDef, selectedSamples } = this;
        const sampleColumnData = assayDef.getSampleColumn();
        const sampleColInResults = sampleColumnData && sampleColumnData.domain === AssayDomainTypes.RESULT;
        const hasSamples = sampleColInResults && selectedSamples;
        // We only care about passing samples to the data grid if there is a sample column in the results domain.
        const rows = hasSamples ? selectedSamples.toJS() : {};
        return { rows, orderedRows: Object.keys(rows) };
    }

    getInitialEditorModelData(queryModelData: Partial<QueryModel>): Partial<EditorModel> {
        // TODO: this will need to be re-written to match the changes Susan made to loadDataForEditor, OR, we make a
        //  version of that method that can be used by this class so we don't have any duplicate code.
        const { orderedRows, rows } = queryModelData;
        const columns = this.queryInfo.getInsertColumns();
        let cellValues = Map<string, List<ValueDescriptor>>();

        // data is initialized in column order
        columns.forEach((col, cn) => {
            orderedRows.forEach((id, rn) => {
                const row = rows[id];
                const cellKey = genCellKey(cn, rn);
                const value = row[col.fieldKey];

                if (List.isList(value)) {
                    // assume to be list of {displayValue, value} objects
                    cellValues = cellValues.set(
                        cellKey,
                        value.reduce(
                            (list, v) => list.push({ display: v.displayValue, raw: v.value }),
                            List<ValueDescriptor>()
                        )
                    );
                } else {
                    // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid
                    // cell
                    let valueDescriptor = { display: value, raw: value };
                    if (col.isLookup() && Utils.isNumber(value)) {
                        valueDescriptor = getLookupDisplayValue(col, getLookupStore(col), value).valueDescriptor;
                    }

                    cellValues = cellValues.set(cellKey, List([valueDescriptor]));
                }
            });
        });

        return {
            cellValues,
            colCount: columns.size,
            deletedIds: Set<any>(),
            rowCount: orderedRows.length,
        };
    }

    /**
     * This method instantiates the initial data used in the editable grid during assay upload, it includes data for
     * an EditorModel and QueryModel.
     */
    getInitialGridData(): { editorModel: Partial<EditorModel>; queryModel: Partial<QueryModel> } {
        const queryModelData = this.getInitialQueryModelData();
        const editorModelData = this.getInitialEditorModelData(queryModelData);
        return { editorModel: editorModelData, queryModel: queryModelData };
    }
}
