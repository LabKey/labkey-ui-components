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
import React, { Component, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { Map, OrderedMap } from 'immutable';
import { AssayDOM, Utils } from '@labkey/api';

import { IMPORT_DATA_FORM_TYPES, AssayUploadTabs } from '../../constants';

import {
    Alert,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayUploadResultModel,
    dismissNotifications,
    FileSizeLimitProps,
    getActionErrorMessage,
    getBatchPropertiesModel,
    getBatchPropertiesRow,
    getQueryDetails,
    getQueryGridModel,
    getRunPropertiesModel,
    getRunPropertiesRow,
    getStateQueryGridModel,
    gridInit,
    importAssayRun,
    loadSelectedSamples,
    LoadingSpinner,
    Location,
    Progress,
    QueryColumn,
    QueryGridModel,
    removeQueryGridModel,
    resolveErrorMessage,
    SchemaQuery,
    withFormSteps,
    WithFormStepsProps,
    WizardNavButtons,
    AssayProtocolModel,
} from '../../..';

import { AssayReimportHeader } from './AssayReimportHeader';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';
import { RunDataPanel } from './RunDataPanel';
import { RunPropertiesPanel } from './RunPropertiesPanel';
import { BatchPropertiesPanel } from './BatchPropertiesPanel';
import { AssayUploadGridLoader } from './AssayUploadGridLoader';
import { AssayWizardModel, IAssayUploadOptions } from './AssayWizardModel';
import {
    checkForDuplicateAssayFiles,
    DuplicateFilesResponse,
    flattenQueryGridModelRow,
    getRunPropertiesFileName,
    uploadAssayRunFiles,
} from './actions';

interface OwnProps {
    assayDefinition: AssayDefinitionModel;
    runId?: string;
    onCancel: () => any;
    onComplete: (response: AssayUploadResultModel, isAsync?: boolean) => any;
    onSave?: (response: AssayUploadResultModel, isAsync?: boolean) => any;
    acceptedPreviewFileFormats?: string;
    location?: Location;
    allowBulkRemove?: boolean;
    allowBulkInsert?: boolean;
    allowBulkUpdate?: boolean;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    maxInsertRows?: number;
    onDataChange?: (dirty: boolean, changeType?: IMPORT_DATA_FORM_TYPES) => any;
    loadSelections?: (location: any, sampleColumn: QueryColumn) => Promise<OrderedMap<any, any>>;
    showUploadTabs?: boolean;
    showQuerySelectPreviewOptions?: boolean;
    runDataPanelTitle?: string;
    beforeFinish?: (data: IAssayUploadOptions) => IAssayUploadOptions;
    getJobDescription?: (options: AssayDOM.IImportRunOptions) => string;
    jobNotificationProvider?: string;
    assayProtocol?: AssayProtocolModel;
    backgroundUpload?: boolean; // assay design setting
    allowAsyncImport?: boolean;
    asyncFileSize?: number;
    asyncRowSize?: number;
}

type Props = OwnProps & WithFormStepsProps;

interface State {
    schemaQuery: SchemaQuery;
    model: AssayWizardModel;
    error: ReactNode;
    showRenameModal: boolean;
    duplicateFileResponse?: DuplicateFilesResponse;
    importAgain?: boolean;
}

class AssayImportPanelsImpl extends Component<Props, State> {
    static defaultProps = {
        loadSelections: loadSelectedSamples,
        showUploadTabs: true,
    };

    assayUploadTimer: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            error: undefined,
            model: this.getInitWizardModel(props),
            schemaQuery: SchemaQuery.create(props.assayDefinition.protocolSchemaName, 'Data'),
            showRenameModal: false,
        };
    }

    UNSAFE_componentWillMount(): void {
        const { location, selectStep } = this.props;

        if (location?.query?.dataTab) {
            selectStep(parseInt(location.query.dataTab, 10));
        }

        this.initModel(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        if (
            this.props.assayDefinition.protocolSchemaName !== nextProps.assayDefinition.protocolSchemaName ||
            this.props.runId !== nextProps.runId
        ) {
            // remove QueryGridModel just in case the URL params change back to this assay
            removeQueryGridModel(this.getDataGridModel());

            this.setState(
                () => ({
                    schemaQuery: SchemaQuery.create(nextProps.assayDefinition.protocolSchemaName, 'Data'),
                    model: this.getInitWizardModel(nextProps),
                }),
                () => {
                    this.initModel(nextProps);
                }
            );
        }
    }

    componentWillUnmount() {
        // remove the QueryGridModel from the global state so it will reload for new assay on next mount
        removeQueryGridModel(this.getDataGridModel());
    }

    getInitWizardModel(props: Props): AssayWizardModel {
        return new AssayWizardModel({ isInit: false, runId: props.runId });
    }

    isReimport(props: Props): boolean {
        return props.runId !== undefined;
    }

    getRunPropertiesModel(props: Props): QueryGridModel {
        return getRunPropertiesModel(props.assayDefinition, props.runId);
    }

    getRunPropertiesRow(props: Props, flatten = true): Map<string, any> {
        const runData = getRunPropertiesRow(props.assayDefinition, props.runId);
        return flatten ? flattenQueryGridModelRow(runData) : runData;
    }

    getBatchId(props: Props): string {
        const runData = this.getRunPropertiesRow(props);
        return runData ? runData.get('Batch') : undefined;
    }

    getBatchPropertiesModel(props: Props): QueryGridModel {
        return getBatchPropertiesModel(props.assayDefinition, this.getBatchId(props));
    }

    getBatchPropertiesRow(props: Props): Map<string, any> {
        const batchData = getBatchPropertiesRow(props.assayDefinition, this.getBatchId(props));
        return flattenQueryGridModelRow(batchData);
    }

    isRunPropertiesInit(props: Props) {
        // if not reimporting, we don't need batch/run properties to display in the form
        const runModel = this.getRunPropertiesModel(props);
        const batchModel = this.getBatchPropertiesModel(props);
        return !this.isReimport(props) || (runModel && runModel.isLoaded && batchModel && batchModel.isLoaded);
    }

    initModel = (props: Props): void => {
        const { assayDefinition, runId } = props;

        if (this.state.model.isInit) {
            return;
        }

        this.initializeGridModels(props);

        // need to query for the assay data table QueryInfo in order to init the AssayWizardModel
        getQueryDetails(this.state.schemaQuery).then(queryInfo => {
            const sampleColumnData = assayDefinition.getSampleColumn();
            this.setState(
                () => ({
                    model: new AssayWizardModel({
                        // we are done here if the assay does not have a sample column and we aren't getting the run properties to show for reimport
                        isInit: sampleColumnData === undefined && this.isRunPropertiesInit(props),
                        assayDef: assayDefinition,
                        batchColumns: assayDefinition.getDomainColumns(AssayDomainTypes.BATCH),
                        runColumns: assayDefinition.getDomainColumns(AssayDomainTypes.RUN),
                        runId,
                        usePreviousRunFile: this.isReimport(props),
                        batchProperties: this.getBatchPropertiesRow(props),
                        runProperties: this.getRunPropertiesRow(props),
                        queryInfo,
                    }),
                }),
                this.onGetQueryDetailsComplete
            );
        });
    };

    initializeGridModels(props: Props) {
        const { model } = this.state;
        const runModel = this.getRunPropertiesModel(props);
        const batchModel = this.getBatchPropertiesModel(props);

        if (!this.isRunPropertiesInit(props)) {
            if (runModel && !runModel.isLoaded) {
                gridInit(runModel, true, this);
            }

            if (batchModel && !batchModel.isLoaded) {
                gridInit(batchModel, true, this);
            }
        }

        if (model.isInit) {
            // only init the gridModel after the state has been set since it uses the AssayWizardModel in the grid loader
            gridInit(this.getDataGridModel(), true, this);
        } else if (
            model.queryInfo &&
            this.isReimport(props) &&
            runModel &&
            runModel.isLoaded &&
            batchModel &&
            batchModel.isLoaded
        ) {
            // if this is a re-import and the batch/run props are now loaded, put them into the state model
            this.setState(
                state => ({
                    model: state.model.merge({
                        isInit: true,
                        batchProperties: this.getBatchPropertiesRow(this.props),
                        runProperties: this.getRunPropertiesRow(this.props),
                    }) as AssayWizardModel,
                }),
                () => {
                    this.onInitModelComplete();
                }
            );
        }
    }

    populateAssayRequest(runProperties): Map<string, any> {
        // Need to pre-populate the run properties form with assayRequest if it is present on the URL (see issue 38711)
        const assayRequest = this.props.location?.query.assayRequest;

        if (assayRequest !== undefined) {
            return runProperties.set('assayRequest', assayRequest);
        }

        return runProperties;
    }

    onGetQueryDetailsComplete = (): void => {
        const { assayDefinition, location } = this.props;
        const sampleColumnData = assayDefinition.getSampleColumn();

        if (sampleColumnData && location) {
            // If the assay has a sample column look up at Batch, Run, or Result level then we want to retrieve
            // the currently selected samples so we can pre-populate the fields in the wizard with the selected
            // samples.
            this.props.loadSelections(location, sampleColumnData.column).then(samples => {
                // Only one sample can be added at batch or run level, so ignore selected samples if multiple are selected.
                let runProperties = this.populateAssayRequest(this.getRunPropertiesRow(this.props));
                let batchProperties = this.getBatchPropertiesRow(this.props);
                if (sampleColumnData && samples && samples.size == 1) {
                    const { column, domain } = sampleColumnData;
                    const selectedSample = samples.first();
                    const sampleValue = selectedSample.getIn([column.fieldKey, 0]).value;

                    if (domain === AssayDomainTypes.RUN) {
                        runProperties = runProperties.set(column.fieldKey, sampleValue);
                    } else if (domain === AssayDomainTypes.BATCH) {
                        batchProperties = batchProperties.set(column.fieldKey, sampleValue);
                    }

                    // Note: we do not do anything with the results domain here if samples are selected because that has to
                    // be addressed by the AssayGridLoader, which grabs the sample data from the selectedSamples property.
                }

                this.setState(
                    state => ({
                        model: state.model.merge({
                            isInit: this.isRunPropertiesInit(this.props),
                            selectedSamples: samples,
                            batchProperties,
                            runProperties,
                        }) as AssayWizardModel,
                    }),
                    this.onInitModelComplete
                );
            });
        } else {
            this.setState(
                state => ({
                    model: state.model.merge({
                        isInit: this.isRunPropertiesInit(this.props),
                        batchProperties: this.getBatchPropertiesRow(this.props),
                        runProperties: this.populateAssayRequest(this.getRunPropertiesRow(this.props)),
                    }) as AssayWizardModel,
                }),
                this.onInitModelComplete
            );
        }
    };

    onInitModelComplete() {
        const runPropsData = this.getRunPropertiesRow(this.props, false);
        const isReimport = this.isReimport(this.props);
        const fileName = getRunPropertiesFileName(runPropsData);
        const runName = runPropsData ? runPropsData.getIn(['Name', 'value']) : undefined;

        // Issue 38237: set the runName and comments for the re-import case
        this.setState(
            state => ({
                model: state.model.merge({
                    runName: isReimport && runName === fileName ? undefined : runName, // Issue 39328
                    comment: runPropsData ? runPropsData.getIn(['Comments', 'value']) : '',
                }) as AssayWizardModel,
            }),
            () => {
                this.initializeGridModels(this.props);
            }
        );
    }

    getDataGridModel(): QueryGridModel {
        const gridModel = getStateQueryGridModel('assay-upload-editable-grid', this.state.schemaQuery, () => ({
            loader: new AssayUploadGridLoader(this.state.model, this.props.assayDefinition),
            allowSelection: false,
            editable: true,
            sortable: false,
        }));

        return getQueryGridModel(gridModel.getId()) || gridModel;
    }

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
        // Here we have to merge incoming values with model.batchProperties because of the way Formsy works.
        // FileInput fields are not Formsy components, so when they send updates they only send the value for their
        // field. When formsy sends updates it sends the entire form (but not file fields). So we need to merge
        // with the known values and then both Formsy and FileInput fields can work together.
        const values = {
            ...this.state.model.batchProperties.toObject(),
            ...fieldValues,
        };

        if (isChanged) {
            this.props.onDataChange?.(true, IMPORT_DATA_FORM_TYPES.OTHER);
        }

        this.handleChange('batchProperties', Map<string, any>(values ? values : {}));
    };

    handleRunChange = (fieldValues: any, isChanged?: boolean): void => {
        // See the note in handleBatchChange for why this method exists.
        const values = {
            ...this.state.model.runProperties.toObject(),
            ...fieldValues,
        };

        let { comment, runName } = this.state.model;

        const cleanedValues = Object.keys(values).reduce((result, key) => {
            const value = values[key];
            if (key === 'runname') {
                runName = value;
            } else if (key === 'comment') {
                comment = value;
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
                }) as AssayWizardModel,
            }));
        });
    };

    handleDataTextChange = (inputName: string, fieldValues: any): void => {
        this.props.onDataChange?.(fieldValues !== undefined && fieldValues !== '', IMPORT_DATA_FORM_TYPES.TEXT);
        // use '' to clear out text area
        this.handleChange('dataText', fieldValues !== undefined ? fieldValues : '');
    };

    handleChange = (prop: string, value: any, onComplete?: () => void): void => {
        clearTimeout(this.assayUploadTimer);

        this.assayUploadTimer = window.setTimeout(() => {
            this.assayUploadTimer = null;
            this.setState(state => ({
                model: state.model.set(prop, value) as AssayWizardModel,
            }));

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
            .catch(reason => {
                this.setState(state => ({
                    error: getActionErrorMessage('There was a problem checking for duplicate file names.', 'assay run'),
                }));
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
            maxInsertRows,
            beforeFinish,
            getJobDescription,
            jobNotificationProvider,
            assayProtocol,
            allowAsyncImport,
            asyncFileSize,
            asyncRowSize,
        } = this.props;
        const { model } = this.state;
        let data = model.prepareFormData(currentStep, this.getDataGridModel());

        if (beforeFinish) {
            data = beforeFinish(data);
        }

        if (
            model.isCopyTab(currentStep) &&
            maxInsertRows &&
            ((Array.isArray(data.dataRows) && data.dataRows.length > maxInsertRows) ||
                (data.dataRows && data.dataRows.size > maxInsertRows))
        ) {
            this.setModelState(
                false,
                'You have exceeded the maximum number of rows allowed (' +
                    maxInsertRows +
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
                    if (allowAsyncImport && !backgroundUpload && assayProtocol?.allowBackgroundUpload) {
                        if (
                            (processedData.maxFileSize && processedData.maxFileSize >= asyncFileSize) ||
                            (processedData.maxRowCount && processedData.maxRowCount >= asyncRowSize)
                        )
                            forceAsync = true;
                    }

                    const jobDescription = getJobDescription ? getJobDescription(data) : undefined;
                    importAssayRun({ ...processedData, forceAsync, jobDescription, jobNotificationProvider })
                        .then((response: AssayUploadResultModel) => {
                            if (this.props.onDataChange) {
                                this.props.onDataChange(false);
                            }
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

    onSuccessContinue = (response: AssayUploadResultModel, isAsync?: boolean): void => {
        this.props.onSave?.(response, isAsync);

        // update the local state model so that it clears the data
        this.setState(
            state => ({
                model: state.model.merge({
                    batchId: response.batchId,
                    lastRunId: response.runId,
                    isSubmitting: false,
                    comment: '', // textarea doesn't clear for undefined
                    dataText: '',
                    runName: undefined,
                    attachedFiles: Map<string, File>(),
                    runProperties: Map<string, any>(),
                    // Note: leave batchProperties alone since those are preserved in this case
                }) as AssayWizardModel,
            }),
            () => {
                // since the onSave might invalidated our grid, need to call gridInit again
                window.setTimeout(() => {
                    gridInit(this.getDataGridModel(), true, this);
                }, 100);
            }
        );
    };

    onSuccessComplete = (response: AssayUploadResultModel, isAsync?: boolean): void => {
        this.setModelState(false, undefined);
        this.props.onComplete(response, isAsync);
    };

    onFailure = (error: any): void => {
        this.setModelState(false, error);
    };

    setModelState(isSubmitting: boolean, errorMsg: ReactNode) {
        this.setState(state => ({
            error: errorMsg,
            model: state.model.merge({
                isSubmitting,
                errorMsg,
            }) as AssayWizardModel,
        }));
    }

    getProgressSizeEstimate(): number {
        const { model } = this.state;
        if (!model.isSubmitting) {
            return;
        }

        const data = model.prepareFormData(this.props.currentStep, this.getDataGridModel());
        if (data.files && data.files.length > 0) {
            return data.files[0].size * 0.2;
        } else if (data.dataRows) {
            if (Utils.isArray(data.dataRows)) {
                return data.dataRows.length * 10;
            } else if (data.dataRows.size) {
                return data.dataRows.size * 10;
            }
        }
    }

    onCancelRename = (): void => {
        this.setState(() => ({
            showRenameModal: false,
            duplicateFileResponse: undefined,
            importAgain: undefined,
        }));
    };

    onRenameConfirm = (): void => {
        const { showRenameModal, importAgain } = this.state;

        if (showRenameModal) {
            this.setState(
                () => ({
                    showRenameModal: false,
                    duplicateFileResponse: undefined,
                    importAgain: undefined,
                }),
                () => {
                    this.onFinish(importAgain);
                }
            );
        }
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
            allowAsyncImport,
        } = this.props;
        const { duplicateFileResponse, model, showRenameModal } = this.state;

        if (!model.isInit) {
            // TODO: Remove this call. We should not be attempting to initialize/mutate during render()
            this.initializeGridModels(this.props);
            return <LoadingSpinner />;
        }

        const dataGridModel = this.getDataGridModel();
        const isReimport = this.isReimport(this.props);
        const showReimportHeader = isReimport && this.getRunPropertiesModel(this.props).isLoaded;
        const showSaveAgainBtn = !isReimport && onSave !== undefined;
        const disabledSave = model.isSubmitting || !model.hasData(currentStep, dataGridModel);

        return (
            <>
                {showReimportHeader && (
                    <AssayReimportHeader
                        assay={model.assayDef}
                        replacedRunProperties={this.getRunPropertiesRow(this.props)}
                        hasBatchProperties={model.batchColumns.size > 0}
                    />
                )}
                <BatchPropertiesPanel
                    model={model}
                    showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                    onChange={this.handleBatchChange}
                />
                <RunPropertiesPanel
                    model={model}
                    showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                    onChange={this.handleRunChange}
                />
                <RunDataPanel
                    currentStep={currentStep}
                    wizardModel={model}
                    gridModel={dataGridModel}
                    onFileChange={this.handleFileChange}
                    onFileRemoval={this.handleFileRemove}
                    onTextChange={this.handleDataTextChange}
                    acceptedPreviewFileFormats={acceptedPreviewFileFormats}
                    fullWidth={false}
                    allowBulkRemove={allowBulkRemove}
                    allowBulkInsert={allowBulkInsert}
                    allowBulkUpdate={allowBulkUpdate}
                    maxEditableGridRowMsg={
                        allowAsyncImport
                            ? "A max of 1,000 rows are allowed. Please use the 'Upload Files' or 'Copy-and-Paste Data' tab if you need to import more than 1,000 rows."
                            : undefined
                    }
                    fileSizeLimits={this.props.fileSizeLimits}
                    maxInsertRows={this.props.maxInsertRows}
                    onGridDataChange={this.props.onDataChange}
                    showTabs={showUploadTabs}
                    title={runDataPanelTitle}
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

export const AssayImportPanels = withFormSteps(AssayImportPanelsImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false,
});
