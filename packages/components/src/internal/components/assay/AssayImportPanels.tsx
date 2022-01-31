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
import { AssayDOM, Filter, Utils } from '@labkey/api';
import { List, Map, OrderedMap } from 'immutable';
import React, { Component, FC, ReactNode, useMemo } from 'react';
import { Button } from 'react-bootstrap';

import {
    Alert,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayProtocolModel,
    AssayUploadResultModel,
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    caseInsensitive,
    dismissNotifications,
    EditorModel,
    FileSizeLimitProps,
    getActionErrorMessage,
    getOperationNotPermittedMessage,
    getQueryDetails,
    getSampleOperationConfirmationData,
    importAssayRun,
    LoadingSpinner,
    LoadingState,
    Location,
    Progress,
    QueryColumn,
    QueryConfigMap,
    resolveErrorMessage,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
    SampleOperation,
    SchemaQuery,
    SCHEMAS,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons,
} from '../../..';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { AssayUploadTabs, IMPORT_DATA_FORM_TYPES } from '../../constants';
import { EditorModelProps } from '../../models';

import { loadSelectedSamples } from '../samples/actions';

import { STATUS_DATA_RETRIEVAL_ERROR } from '../samples/constants';

import {
    checkForDuplicateAssayFiles,
    DuplicateFilesResponse,
    flattenQueryModelRow,
    getRunPropertiesFileName,
    uploadAssayRunFiles,
} from './actions';
import { AssayReimportHeader } from './AssayReimportHeader';
import { AssayWizardModel, IAssayUploadOptions } from './AssayWizardModel';
import { BatchPropertiesPanel } from './BatchPropertiesPanel';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';
import { RunDataPanel } from './RunDataPanel';
import { RunPropertiesPanel } from './RunPropertiesPanel';

const BATCH_PROPERTIES_GRID_ID = 'assay-batch-details';
const DATA_GRID_ID = 'assay-grid-data';

interface OwnProps {
    assayDefinition: AssayDefinitionModel;
    runId?: string;
    onCancel: () => void;
    onComplete: (response: AssayUploadResultModel, isAsync?: boolean) => void;
    onSave?: (response: AssayUploadResultModel, isAsync?: boolean) => void;
    acceptedPreviewFileFormats?: string;
    location?: Location;
    allowBulkRemove?: boolean;
    allowBulkInsert?: boolean;
    allowBulkUpdate?: boolean;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    maxRows?: number;
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => void;
    loadSelectedSamples?: (location: Location, sampleColumn: QueryColumn) => Promise<OrderedMap<any, any>>;
    showUploadTabs?: boolean;
    showQuerySelectPreviewOptions?: boolean;
    runDataPanelTitle?: string;
    beforeFinish?: (data: IAssayUploadOptions) => IAssayUploadOptions;
    getJobDescription?: (options: AssayDOM.IImportRunOptions) => string;
    jobNotificationProvider?: string;
    assayProtocol?: AssayProtocolModel;
    backgroundUpload?: boolean; // assay design setting
}

type Props = OwnProps & WithFormStepsProps & InjectedQueryModels;

interface State {
    duplicateFileResponse?: DuplicateFilesResponse;
    error: ReactNode;
    dataModel: QueryModel;
    editorModel: EditorModel;
    importAgain?: boolean;
    model: AssayWizardModel;
    sampleStatusWarning: string;
    schemaQuery: SchemaQuery;
    showRenameModal: boolean;
}

class AssayImportPanelsBody extends Component<Props, State> {
    static defaultProps = {
        loadSelectedSamples,
        showUploadTabs: true,
    };

    assayUploadTimer: number;

    constructor(props: Props) {
        super(props);
        const schemaQuery = SchemaQuery.create(props.assayDefinition.protocolSchemaName, 'Data');
        this.state = {
            dataModel: new QueryModel({ id: DATA_GRID_ID, schemaQuery }),
            editorModel: new EditorModel({ id: DATA_GRID_ID }),
            error: undefined,
            model: new AssayWizardModel({ isInit: false, runId: props.runId }),
            schemaQuery,
            showRenameModal: false,
            sampleStatusWarning: undefined,
        };
    }

    componentDidMount() {
        const { location, selectStep } = this.props;

        if (location?.query?.dataTab) {
            selectStep(parseInt(location.query.dataTab, 10));
        }

        this.initModel();
    }

    componentDidUpdate() {
        const { queryModels, actions, assayDefinition } = this.props;
        const batchId = this.getBatchId();

        if (!queryModels[BATCH_PROPERTIES_GRID_ID] && batchId) {
            actions.addModel(
                {
                    id: BATCH_PROPERTIES_GRID_ID,
                    keyValue: batchId,
                    schemaQuery: SchemaQuery.create(assayDefinition.protocolSchemaName, 'Batches'),
                    requiredColumns: SCHEMAS.CBMB.concat('Name', 'RowId').toArray(),
                },
                true
            );
        }

        this.ensureRunAndBatchProperties();
    }

    isReimport = (): boolean => {
        return this.props.runId !== undefined;
    };

    getRunPropsQueryModel = (): QueryModel => {
        return this.props.queryModels.model;
    };

    getRunPropertiesMap = (): Map<string, any> => {
        const { location } = this.props;
        let runProperties = flattenQueryModelRow(this.getRunPropsQueryModel()?.getRow());

        // Issue 38711: Need to pre-populate the run properties form with assayRequest if it is present on the URL
        if (location?.query?.assayRequest !== undefined) {
            runProperties = runProperties.set('assayRequest', location.query.assayRequest);
        }

        return runProperties;
    };

    getBatchId = (): string => {
        const runPropRow = this.getRunPropsQueryModel()?.getRow();
        return runPropRow ? caseInsensitive(runPropRow, 'Batch').value : undefined;
    };

    getBatchPropsQueryModel = (): QueryModel => {
        return this.props.queryModels[BATCH_PROPERTIES_GRID_ID];
    };

    getBatchPropertiesMap = (): Map<string, any> => {
        const model = this.getBatchPropsQueryModel();
        return flattenQueryModelRow(model?.getRow());
    };

    runAndBatchPropsLoaded = (): boolean => {
        // if not reimporting, we don't need batch/run properties to display in the form
        const runQueryModel = this.getRunPropsQueryModel();
        const batchQueryModel = this.getBatchPropsQueryModel();
        return (
            !this.isReimport() ||
            (runQueryModel && !runQueryModel.isLoading && batchQueryModel && !batchQueryModel.isLoading)
        );
    };

    initModel = (): void => {
        const { assayDefinition, location, runId } = this.props;
        const { schemaQuery } = this.state;
        let workflowTask;

        if (location.query?.workflowTaskId) {
            const _workflowTask = parseInt(location.query?.workflowTaskId, 10);
            workflowTask = isNaN(_workflowTask) ? undefined : _workflowTask;
        }

        getQueryDetails(schemaQuery).then(queryInfo => {
            const sampleColumnData = assayDefinition.getSampleColumn();
            this.setState(
                () => ({
                    model: new AssayWizardModel({
                        // Initialization is done if the assay does not have a sample column and we aren't getting the
                        // run properties to show for reimport
                        isInit: sampleColumnData === undefined && this.runAndBatchPropsLoaded(),
                        assayDef: assayDefinition,
                        batchColumns: assayDefinition.getDomainColumns(AssayDomainTypes.BATCH),
                        runColumns: assayDefinition.getDomainColumns(AssayDomainTypes.RUN),
                        runId,
                        usePreviousRunFile: this.isReimport(),
                        batchProperties: this.getBatchPropertiesMap(),
                        runProperties: this.getRunPropertiesMap(),
                        queryInfo,
                        workflowTask,
                    }),
                }),
                this.onGetQueryDetailsComplete
            );
        });
    };

    ensureRunAndBatchProperties = (): void => {
        const { isInit, queryInfo } = this.state.model;

        if (!isInit && queryInfo && this.isReimport() && this.runAndBatchPropsLoaded()) {
            // if this is a re-import and the batch/run props are now loaded, put them into the state model
            this.setState(
                state => ({
                    model: state.model.merge({
                        isInit: true,
                        batchProperties: this.getBatchPropertiesMap(),
                        runProperties: this.getRunPropertiesMap(),
                    }) as AssayWizardModel,
                }),
                this.onInitModelComplete
            );
        }
    };

    onGetQueryDetailsComplete = async (): Promise<void> => {
        const { assayDefinition, location } = this.props;
        const sampleColumnData = assayDefinition.getSampleColumn();

        let sampleStatusWarning: string;
        const modelUpdates: Partial<AssayWizardModel> = {
            batchProperties: this.getBatchPropertiesMap(),
            isInit: this.runAndBatchPropsLoaded(),
            runProperties: this.getRunPropertiesMap(),
        };

        if (sampleColumnData && location) {
            try {
                // If the assay has a sample column look up at Batch, Run, or Result level then we want to retrieve
                // the currently selected samples so we can pre-populate the fields in the wizard with the selected
                // samples.
                // Additionally, we want to pre-populate the fields in the wizard with samples if the job has samples
                // associated with it, and the assay has a sample column.
                const { column, domain } = sampleColumnData;
                const samples = await this.props.loadSelectedSamples(location, column);

                const statusConfirmationData = await getSampleOperationConfirmationData(
                    SampleOperation.AddAssayData,
                    undefined,
                    samples.keySeq().toArray()
                );

                // Only one sample can be added at batch or run level, so ignore selected samples if multiple are selected.
                const validSamples = samples.filter((_, key) => statusConfirmationData.isIdAllowed(key)).toOrderedMap();

                if (validSamples.size === 1) {
                    const sampleValue = validSamples.first().getIn([column.fieldKey, 0]).value;

                    if (domain === AssayDomainTypes.RUN) {
                        modelUpdates.runProperties = modelUpdates.runProperties.set(column.fieldKey, sampleValue);
                    } else if (domain === AssayDomainTypes.BATCH) {
                        modelUpdates.batchProperties = modelUpdates.batchProperties.set(column.fieldKey, sampleValue);
                    }

                    // Note: we do not do anything with the results domain here if samples are selected because that has to
                    // be addressed by the AssayGridLoader, which grabs the sample data from the selectedSamples property.
                }

                modelUpdates.selectedSamples = validSamples;

                if (samples.size > 0) {
                    sampleStatusWarning = getOperationNotPermittedMessage(
                        SampleOperation.AddAssayData,
                        statusConfirmationData
                    );
                }
            } catch (e) {
                this.setState({ error: STATUS_DATA_RETRIEVAL_ERROR });
                return;
            }
        }

        this.setState(
            state => ({
                model: state.model.merge(modelUpdates) as AssayWizardModel,
                sampleStatusWarning,
            }),
            this.onInitModelComplete
        );
    };

    onInitModelComplete = async (): Promise<void> => {
        const runPropsRow = this.getRunPropsQueryModel()?.getRow();
        const isReimport = this.isReimport();
        const fileName = getRunPropertiesFileName(runPropsRow);
        const runName = runPropsRow ? caseInsensitive(runPropsRow, 'Name').value : undefined;
        const gridData = await this.state.model.getInitialGridData();

        // Issue 38237: set the runName and comments for the re-import case
        this.setState(state => {
            const model = state.model.merge({
                runName: isReimport && runName === fileName ? undefined : runName, // Issue 39328
                comment: runPropsRow ? caseInsensitive(runPropsRow, 'Comments').value : '',
            }) as AssayWizardModel;
            return {
                model,
                dataModel: state.dataModel.mutate({
                    ...gridData.queryModel,
                    queryInfo: model.queryInfo,
                    rowsLoadingState: LoadingState.LOADED,
                    queryInfoLoadingState: LoadingState.LOADED,
                }),
                editorModel: state.editorModel.merge(gridData.editorModel) as EditorModel,
            };
        });
    };

    handleFileChange = (attachments: Map<string, File>): void => {
        this.props.onDataChange?.(attachments.size > 0, IMPORT_DATA_FORM_TYPES.FILE);

        this.setState(state => ({
            error: undefined,
            model: state.model.merge({
                attachedFiles: attachments,
                usePreviousRunFile: false,
            }) as AssayWizardModel,
        }));
    };

    handleFileRemove = (): void => {
        this.props.onDataChange?.(false, IMPORT_DATA_FORM_TYPES.FILE);

        this.setState(state => ({
            error: undefined,
            model: state.model.merge({
                attachedFiles: Map<string, File>(),
                usePreviousRunFile: false,
            }) as AssayWizardModel,
        }));
    };

    handleBatchChange = (fieldValues: any, isChanged?: boolean): void => {
        const values = { ...this.state.model.batchProperties.toObject(), ...fieldValues };

        if (isChanged) {
            this.props.onDataChange?.(true, IMPORT_DATA_FORM_TYPES.OTHER);
        }

        this.handleChange('batchProperties', Map<string, any>(values ? values : {}));
    };

    handleRunChange = (fieldValues: any, isChanged?: boolean): void => {
        const values = { ...this.state.model.runProperties.toObject(), ...fieldValues };
        let { comment, runName, workflowTask } = this.state.model;

        const cleanedValues = Object.keys(values).reduce((result, key) => {
            const value = values[key];
            if (key === 'runname') {
                runName = value;
            } else if (key === 'comment') {
                comment = value;
            } else if (key === 'workflowtask') {
                workflowTask = value;
            } else if (value !== undefined) {
                result[key] = value;
            }
            return result;
        }, {});

        if (isChanged) {
            this.props.onDataChange?.(true, IMPORT_DATA_FORM_TYPES.OTHER);
        }

        this.handleChange('runProperties', OrderedMap<string, any>(cleanedValues), () => {
            this.setState(state => ({
                model: state.model.merge({
                    runName,
                    comment,
                    workflowTask,
                }) as AssayWizardModel,
            }));
        });
    };

    handleDataTextChange = (fieldValues: any): void => {
        this.props.onDataChange?.(fieldValues !== undefined && fieldValues !== '', IMPORT_DATA_FORM_TYPES.TEXT);
        // use '' to clear out text area
        this.handleChange('dataText', fieldValues !== undefined ? fieldValues : '');
    };

    handleChange = (prop: string, value: any, onComplete?: () => void): void => {
        clearTimeout(this.assayUploadTimer);

        this.assayUploadTimer = window.setTimeout(() => {
            this.assayUploadTimer = null;
            this.setState(state => ({ model: state.model.set(prop, value) as AssayWizardModel }));
            onComplete?.();
        }, 250);
    };

    checkForDuplicateFiles = (importAgain: boolean): void => {
        checkForDuplicateAssayFiles(this.state.model.attachedFiles.keySeq().toArray())
            .then(response => {
                if (response.duplicate) {
                    this.setState(() => ({
                        showRenameModal: true,
                        duplicateFileResponse: response,
                        importAgain,
                    }));
                } else {
                    this.onFinish(importAgain);
                }
            })
            .catch(() => {
                this.setState({
                    error: getActionErrorMessage('There was a problem checking for duplicate file names.', 'assay run'),
                });
            });
    };

    onSaveClick = (importAgain: boolean): void => {
        if (this.state.model.isFilesTab(this.props.currentStep)) {
            this.checkForDuplicateFiles(importAgain);
        } else {
            this.onFinish(importAgain);
        }
    };

    onFinish = (importAgain: boolean): void => {
        const {
            currentStep,
            onSave,
            maxRows,
            beforeFinish,
            getJobDescription,
            jobNotificationProvider,
            assayProtocol,
            location,
        } = this.props;
        const { model } = this.state;
        let data = model.prepareFormData(currentStep, this.state.editorModel, this.state.dataModel);

        if (beforeFinish) {
            data = beforeFinish(data);
        }

        if (
            model.isCopyTab(currentStep) &&
            maxRows &&
            ((Array.isArray(data.dataRows) && data.dataRows.length > maxRows) ||
                (data.dataRows && data.dataRows.size > maxRows))
        ) {
            this.setModelState(
                false,
                'You have exceeded the maximum number of rows allowed (' +
                    maxRows +
                    ').  Please divide your data into smaller groups and try again.'
            );
        } else {
            this.setModelState(true, undefined);
            dismissNotifications();
            const errorPrefix = 'There was a problem importing the assay results.';
            uploadAssayRunFiles(data)
                .then(processedData => {
                    const backgroundUpload = assayProtocol?.backgroundUpload;
                    let forceAsync = false;
                    if (!backgroundUpload && assayProtocol?.allowBackgroundUpload) {
                        const asyncFileSize = location.query?.useAsync === 'true' ? 1 : BACKGROUND_IMPORT_MIN_FILE_SIZE;
                        const asyncRowSize = location.query?.useAsync === 'true' ? 1 : BACKGROUND_IMPORT_MIN_ROW_SIZE;
                        if (
                            (processedData.maxFileSize && processedData.maxFileSize >= asyncFileSize) ||
                            (processedData.maxRowCount && processedData.maxRowCount >= asyncRowSize)
                        )
                            forceAsync = true;
                    }

                    const jobDescription = getJobDescription ? getJobDescription(data) : undefined;
                    importAssayRun({ ...processedData, forceAsync, jobDescription, jobNotificationProvider })
                        .then((response: AssayUploadResultModel) => {
                            this.props.onDataChange?.(false);
                            if (importAgain && onSave) {
                                this.onSuccessContinue(response, backgroundUpload || forceAsync);
                            } else {
                                this.onSuccessComplete(response, backgroundUpload || forceAsync);
                            }
                        })
                        .catch(reason => {
                            console.error('Problem importing assay run', reason);
                            const message = resolveErrorMessage(reason);
                            this.onFailure(
                                message
                                    ? errorPrefix + ' ' + message
                                    : getActionErrorMessage(errorPrefix, 'referenced samples or assay design', false)
                            );
                        });
                })
                .catch(reason => {
                    console.error('Problem uploading assay run files', reason);
                    const message = resolveErrorMessage(reason);
                    this.onFailure(
                        message
                            ? errorPrefix + ' ' + message
                            : getActionErrorMessage(errorPrefix, 'referenced samples or assay design', false)
                    );
                });
        }
    };

    onSuccessContinue = async (response: AssayUploadResultModel, isAsync?: boolean): Promise<void> => {
        this.props.onSave?.(response, isAsync);
        const initialGridData = await this.state.model.getInitialGridData();

        // Reset the data for the AssayWizardModel and dataModel
        this.setState(state => {
            const model = state.model.merge({
                batchId: response.batchId,
                lastRunId: response.runId,
                isSubmitting: false,
                comment: '', // textarea doesn't clear for undefined
                dataText: '',
                runName: undefined,
                attachedFiles: Map<string, File>(),
                runProperties: Map<string, any>(),
                // Note: leave batchProperties alone since those are preserved in this case
            }) as AssayWizardModel;
            const dataModel = state.dataModel.mutate(initialGridData.queryModel);
            const editorModel = state.editorModel.merge(initialGridData.editorModel) as EditorModel;
            return { dataModel, editorModel, model };
        });
    };

    onSuccessComplete = (response: AssayUploadResultModel, isAsync?: boolean): void => {
        this.setModelState(false, undefined);
        this.props.onComplete(response, isAsync);
    };

    onFailure = (error: any): void => {
        this.setModelState(false, error);
    };

    setModelState = (isSubmitting: boolean, errorMsg: ReactNode): void => {
        this.setState(state => ({
            error: errorMsg,
            model: state.model.merge({ isSubmitting }) as AssayWizardModel,
        }));
    };

    getProgressSizeEstimate = (): number => {
        const { model } = this.state;
        if (!model.isSubmitting) {
            return;
        }

        const data = model.prepareFormData(this.props.currentStep, this.state.editorModel, this.state.dataModel);

        if (data.files && data.files.length > 0) {
            return data.files[0].size * 0.2;
        } else if (data.dataRows) {
            if (Utils.isArray(data.dataRows)) {
                return data.dataRows.length * 10;
            } else if (data.dataRows.size) {
                return data.dataRows.size * 10;
            }
        }
    };

    onCancelRename = (): void => {
        this.setState({ showRenameModal: false, duplicateFileResponse: undefined, importAgain: undefined });
    };

    onRenameConfirm = (): void => {
        const { importAgain } = this.state;
        this.setState(
            () => ({ showRenameModal: false, duplicateFileResponse: undefined, importAgain: undefined }),
            () => this.onFinish(importAgain)
        );
    };

    onGridChange = (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<any, Map<string, any>>
    ): void => {
        this.setState(state => {
            const editorModel = state.editorModel.merge(editorModelChanges) as EditorModel;
            let { dataModel } = state;
            const orderedRows = dataKeys?.toJS();
            const rows = data?.toJS();

            if (orderedRows !== undefined && rows !== undefined) {
                dataModel = dataModel.mutate({ orderedRows, rows });
            }

            this.props.onDataChange?.(true, IMPORT_DATA_FORM_TYPES.GRID);

            return { dataModel, editorModel };
        });
    };

    render(): ReactNode {
        const {
            currentStep,
            onCancel,
            acceptedPreviewFileFormats,
            allowBulkRemove,
            allowBulkInsert,
            allowBulkUpdate,
            onSave,
            showUploadTabs,
            showQuerySelectPreviewOptions,
            runDataPanelTitle,
        } = this.props;
        const { dataModel, duplicateFileResponse, editorModel, model, showRenameModal, sampleStatusWarning } =
            this.state;

        if (!model.isInit) {
            return <LoadingSpinner />;
        }

        const runPropsModel = this.getRunPropsQueryModel();
        const isReimport = this.isReimport();
        const showReimportHeader = isReimport && !runPropsModel?.isLoading;
        const showSaveAgainBtn = !isReimport && onSave !== undefined;
        const disabledSave = model.isSubmitting || !model.hasData(currentStep);

        return (
            <>
                {showReimportHeader && (
                    <AssayReimportHeader
                        assay={model.assayDef}
                        replacedRunProperties={runPropsModel.getRow()}
                        hasBatchProperties={model.batchColumns.size > 0}
                    />
                )}
                <Alert bsStyle="warning">{sampleStatusWarning}</Alert>
                <BatchPropertiesPanel
                    model={model}
                    onChange={this.handleBatchChange}
                    showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                />
                <RunPropertiesPanel
                    model={model}
                    onChange={this.handleRunChange}
                    showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                />
                <RunDataPanel
                    acceptedPreviewFileFormats={acceptedPreviewFileFormats}
                    allowBulkRemove={allowBulkRemove}
                    allowBulkInsert={allowBulkInsert}
                    allowBulkUpdate={allowBulkUpdate}
                    currentStep={currentStep}
                    editorModel={editorModel}
                    fileSizeLimits={this.props.fileSizeLimits}
                    maxEditableGridRowMsg={
                        "A max of 1,000 rows are allowed. Please use the 'Upload Files' or 'Copy-and-Paste Data' tab if you need to import more than 1,000 rows."
                    }
                    maxRows={this.props.maxRows}
                    onFileChange={this.handleFileChange}
                    onFileRemoval={this.handleFileRemove}
                    onGridChange={this.onGridChange}
                    onTextChange={this.handleDataTextChange}
                    queryModel={dataModel}
                    runPropertiesRow={runPropsModel.getRow()}
                    showTabs={showUploadTabs}
                    title={runDataPanelTitle}
                    wizardModel={model}
                />
                {this.state.error && <Alert bsStyle="danger">{this.state.error}</Alert>}
                <WizardNavButtons cancel={onCancel} containerClassName="" includeNext={false}>
                    {showSaveAgainBtn && (
                        <Button type="submit" onClick={this.onSaveClick.bind(this, true)} disabled={disabledSave}>
                            {model.isSubmitting ? 'Saving...' : 'Save and Import Another Run'}
                        </Button>
                    )}
                    <Button
                        type="submit"
                        bsStyle="success"
                        onClick={this.onSaveClick.bind(this, false)}
                        disabled={disabledSave}
                    >
                        {showSaveAgainBtn
                            ? model.isSubmitting
                                ? 'Saving...'
                                : 'Save and Finish'
                            : model.isSubmitting
                            ? 'Importing...'
                            : isReimport
                            ? 'Re-Import'
                            : 'Import'}
                    </Button>
                </WizardNavButtons>
                <Progress
                    estimate={this.getProgressSizeEstimate()}
                    modal={true}
                    title={isReimport ? 'Re-importing assay run' : 'Importing assay run'}
                    toggle={model.isSubmitting}
                />
                {showRenameModal && (
                    <ImportWithRenameConfirmModal
                        onConfirm={this.onRenameConfirm}
                        onCancel={this.onCancelRename}
                        originalName={model.attachedFiles.keySeq().get(0)}
                        newName={duplicateFileResponse.newFileNames[0]}
                    />
                )}
            </>
        );
    }
}

const AssayImportPanelWithQueryModels = withQueryModels<OwnProps & WithFormStepsProps>(AssayImportPanelsBody);

const AssayImportPanelsBodyImpl: FC<OwnProps & WithFormStepsProps> = props => {
    const { assayDefinition, runId } = props;
    const key = [runId, assayDefinition.protocolSchemaName].join('|');
    const schemaQuery = useMemo(
        () => SchemaQuery.create(assayDefinition.protocolSchemaName, 'Runs'),
        [assayDefinition.protocolSchemaName]
    );
    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            model: {
                keyValue: runId,
                schemaQuery,
                requiredColumns: RUN_PROPERTIES_REQUIRED_COLUMNS.toArray(),
                baseFilters: [
                    Filter.create('RowId', runId || -1),
                    // allow for the possibility of viewing runs that have been replaced.
                    Filter.create('Replaced', undefined, Filter.Types.NONBLANK),
                ],
            },
        }),
        [runId, schemaQuery]
    );

    return <AssayImportPanelWithQueryModels autoLoad key={key} queryConfigs={queryConfigs} {...props} />;
};

export const AssayImportPanels = withFormSteps(AssayImportPanelsBodyImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false,
});
