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

import { Location } from '../../util/URL';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AssayUploadTabs } from '../../constants';
import { EditorModel, EditorModelProps } from '../editable/models';

import {
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
} from '../pipeline/constants';

import { loadSelectedSamples } from '../samples/actions';

import { SampleOperation, STATUS_DATA_RETRIEVAL_ERROR } from '../samples/constants';

import { AssayDefinitionModel, AssayDomainTypes } from '../../AssayDefinitionModel';

import { FileSizeLimitProps } from '../../../public/files/models';
import { QueryColumn } from '../../../public/QueryColumn';
import { AssayProtocolModel } from '../domainproperties/assay/models';
import { withFormSteps, WithFormStepsProps } from '../forms/FormStep';
import { NotificationsContextProps, withNotificationsContext } from '../notifications/NotificationsContext';
import { User } from '../base/models/User';
import { Container } from '../base/models/Container';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getQueryDetails } from '../../query/api';
import { getSampleOperationConfirmationData } from '../entities/actions';
import { LoadingState } from '../../../public/LoadingState';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { Progress } from '../base/Progress';
import { useServerContext } from '../base/ServerContext';
import { getOperationNotPermittedMessage } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { isPremiumProductEnabled } from '../../app/utils';

import { AssayUploadResultModel } from './models';
import { RunPropertiesPanel } from './RunPropertiesPanel';
import { RunDataPanel } from './RunDataPanel';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';
import { BatchPropertiesPanel } from './BatchPropertiesPanel';
import { AssayWizardModel, IAssayUploadOptions } from './AssayWizardModel';
import { AssayReimportHeader } from './AssayReimportHeader';
import {
    allowReimportAssayRun,
    checkForDuplicateAssayFiles,
    DuplicateFilesResponse,
    flattenQueryModelRow,
    getRunPropertiesFileName,
    importAssayRun,
    uploadAssayRunFiles,
} from './actions';
import { RUN_PROPERTIES_REQUIRED_COLUMNS } from './constants';

const BASE_FILE_TYPES = ['.csv', '.tsv', '.txt', '.xlsx', '.xls'];
const BATCH_PROPERTIES_GRID_ID = 'assay-batch-details';
const DATA_GRID_ID = 'assay-grid-data';

interface OwnProps {
    acceptedPreviewFileFormats?: string;
    allowBulkInsert?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    assayDefinition: AssayDefinitionModel;
    assayProtocol?: AssayProtocolModel;
    // assay design setting
    backgroundUpload?: boolean;
    beforeFinish?: (data: IAssayUploadOptions) => IAssayUploadOptions;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    getIsDirty?: () => boolean;
    jobNotificationProvider?: string;
    loadSelectedSamples?: (location: Location, sampleColumn: QueryColumn) => Promise<OrderedMap<any, any>>;
    location?: Location;
    // Not currently used, but related logic retained in component
    maxRows?: number;
    onCancel: () => void;
    onComplete: (response: AssayUploadResultModel, isAsync?: boolean) => void;
    onSave?: (response: AssayUploadResultModel, isAsync?: boolean) => void;
    runDataPanelTitle?: string;
    runId?: string;
    setIsDirty?: (isDirty: boolean) => void;
    showQuerySelectPreviewOptions?: boolean;
    showUploadTabs?: boolean;
}

interface AssayImportPanelsBodyProps {
    container: Partial<Container>;
    user: User;
}

type Props = AssayImportPanelsBodyProps &
    OwnProps &
    WithFormStepsProps &
    InjectedQueryModels &
    NotificationsContextProps;

interface State {
    dataModel: QueryModel;
    duplicateFileResponse?: DuplicateFilesResponse;
    editorModel: EditorModel;
    error: ReactNode;
    importAgain?: boolean;
    model: AssayWizardModel;
    sampleStatusWarning: string;
    schemaQuery: SchemaQuery;
    showRenameModal: boolean;
}

class AssayImportPanelsBody extends Component<Props, State> {
    static defaultProps = {
        acceptedPreviewFileFormats: BASE_FILE_TYPES.join(', '),
        fileSizeLimits: DATA_IMPORT_FILE_SIZE_LIMITS,
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
        let runProperties = flattenQueryModelRow(this.getRunPropsQueryModel().getRow());

        // Issue 38711: Need to pre-populate the run properties form with assayRequest if it is present on the URL
        if (location?.query?.assayRequest !== undefined) {
            runProperties = runProperties.set('assayRequest', location.query.assayRequest);
        }

        return runProperties;
    };

    getBatchId = (): string => {
        return this.getRunPropsQueryModel().getRowValue('Batch');
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

        if (location?.query?.workflowTaskId) {
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
        const runPropsModel = this.getRunPropsQueryModel();
        const runName = runPropsModel.getRowValue('Name');
        const fileName = getRunPropertiesFileName(runPropsModel.getRow());
        const gridData = await this.state.model.getInitialGridData();

        // Issue 38237: set the runName and comments for the re-import case
        this.setState(state => {
            const model = state.model.merge({
                runName: this.isReimport() && runName === fileName ? undefined : runName, // Issue 39328
                comment: runPropsModel.getRowValue('Comments') ?? '',
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
        this.props.setIsDirty?.(attachments.size > 0);

        this.setState(state => ({
            error: undefined,
            model: state.model.merge({
                attachedFiles: attachments,
                usePreviousRunFile: false,
            }) as AssayWizardModel,
        }));
    };

    handleFileRemove = (): void => {
        this.props.setIsDirty?.(false);

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
            this.props.setIsDirty?.(true);
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
            this.props.setIsDirty?.(true);
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
        this.props.setIsDirty?.(fieldValues !== undefined && fieldValues !== '');
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

    getBackgroundJobDescription = (options: AssayDOM.IImportRunOptions): string => {
        const { assayDefinition } = this.props;
        return assayDefinition.name + (options.name ? ' - ' + options.name : '');
    };

    onFinish = (importAgain: boolean): void => {
        const {
            currentStep,
            onSave,
            beforeFinish,
            jobNotificationProvider,
            assayProtocol,
            location,
            dismissNotifications,
        } = this.props;
        const { model } = this.state;
        let data = model.prepareFormData(currentStep, this.state.editorModel, this.state.dataModel);

        if (beforeFinish) {
            data = beforeFinish(data);
        }

        this.setModelState(true, undefined);
        dismissNotifications();
        const errorPrefix = 'There was a problem importing the assay results.';
        uploadAssayRunFiles(data)
            .then(processedData => {
                const backgroundUpload = assayProtocol?.backgroundUpload;
                let forceAsync = false;
                if (!backgroundUpload && assayProtocol?.allowBackgroundUpload) {
                    const asyncFileSize =
                        location?.query?.useAsync === 'true' ? 1 : BACKGROUND_IMPORT_MIN_FILE_SIZE;
                    const asyncRowSize = location?.query?.useAsync === 'true' ? 1 : BACKGROUND_IMPORT_MIN_ROW_SIZE;
                    if (
                        (processedData.maxFileSize && processedData.maxFileSize >= asyncFileSize) ||
                        (processedData.maxRowCount && processedData.maxRowCount >= asyncRowSize)
                    )
                        forceAsync = true;
                }

                const jobDescription = this.getBackgroundJobDescription(data);
                importAssayRun({ ...processedData, forceAsync, jobDescription, jobNotificationProvider })
                    .then((response: AssayUploadResultModel) => {
                        this.props.setIsDirty?.(false);
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

            this.props.setIsDirty?.(true);

            return { dataModel, editorModel };
        });
    };

    render(): ReactNode {
        const {
            container,
            currentStep,
            onCancel,
            acceptedPreviewFileFormats,
            allowBulkRemove,
            allowBulkInsert,
            allowBulkUpdate,
            maxRows,
            onSave,
            showUploadTabs,
            showQuerySelectPreviewOptions,
            runDataPanelTitle,
            fileSizeLimits,
            user,
            getIsDirty,
            setIsDirty,
        } = this.props;
        const { dataModel, duplicateFileResponse, editorModel, model, showRenameModal, sampleStatusWarning } =
            this.state;
        const runPropsModel = this.getRunPropsQueryModel();

        if (!model.isInit || runPropsModel.isLoading) {
            return <LoadingSpinner />;
        } else if (runPropsModel.hasLoadErrors) {
            return (
                <Alert>
                    <ul>
                        {runPropsModel.loadErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                        ))}
                    </ul>
                </Alert>
            );
        }

        const isReimport = this.isReimport();
        const runContainerId = runPropsModel.getRowValue('Folder');
        const folderNoun = isPremiumProductEnabled() ? 'project' : 'folder';

        if (isReimport && !allowReimportAssayRun(user, runContainerId, container.id)) {
            const runName = runPropsModel.getRowValue('Name');
            return (
                <Alert>
                    The run "{runName}" cannot be re-imported into this ${folderNoun}. This run is declared in a
                    different ${folderNoun} and re-import of runs is only supported within the same ${folderNoun}.
                </Alert>
            );
        }

        const showSaveAgainBtn = !isReimport && onSave !== undefined;
        const disabledSave = model.isSubmitting || !model.hasData(currentStep, editorModel);
        const runProps = runPropsModel.getRow();

        return (
            <>
                {isReimport && (
                    <AssayReimportHeader
                        assay={model.assayDef}
                        replacedRunProperties={runProps}
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
                    fileSizeLimits={fileSizeLimits}
                    maxEditableGridRowMsg={`A max of ${maxRows} rows are allowed. Please use the 'Import Data from File' tab if you need to import more than ${maxRows} rows.`}
                    maxRows={maxRows}
                    onFileChange={this.handleFileChange}
                    onFileRemoval={this.handleFileRemove}
                    onGridChange={this.onGridChange}
                    onTextChange={this.handleDataTextChange}
                    queryModel={dataModel}
                    runPropertiesRow={runProps}
                    showTabs={showUploadTabs}
                    title={runDataPanelTitle}
                    wizardModel={model}
                    getIsDirty={getIsDirty}
                    setIsDirty={setIsDirty}
                />
                <Alert>{this.state.error}</Alert>
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
                        {model.isSubmitting ? 'Importing...' : isReimport ? 'Re-Import' : 'Import'}
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

const AssayImportPanelWithQueryModels = withQueryModels<AssayImportPanelsBodyProps & OwnProps & WithFormStepsProps>(
    withNotificationsContext(AssayImportPanelsBody)
);

const AssayImportPanelsBodyImpl: FC<OwnProps & WithFormStepsProps> = props => {
    const { assayDefinition, runId } = props;
    const { container, user } = useServerContext();
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

    return (
        <AssayImportPanelWithQueryModels
            {...props}
            autoLoad
            container={container}
            key={key}
            queryConfigs={queryConfigs}
            user={user}
        />
    );
};

export const AssayImportPanels = withFormSteps(AssayImportPanelsBodyImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Files,
    hasDependentSteps: false,
});
