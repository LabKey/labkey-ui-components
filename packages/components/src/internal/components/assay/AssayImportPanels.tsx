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
import { Map, OrderedMap } from 'immutable';
import React, { Component, FC, memo, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FileSizeLimitProps } from '../../../public/files/models';
import { Operation, QueryColumn } from '../../../public/QueryColumn';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryInfo } from '../../../public/QueryInfo';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { isPlatesEnabled } from '../../app/utils';

import { AssayDefinitionModel, AssayDomainTypes } from '../../AssayDefinitionModel';

import { AssayUploadTabs, MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { FormButtons } from '../../FormButtons';
import { getQueryDetails } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';

import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { Progress } from '../base/Progress';
import { ModuleContext, useServerContext } from '../base/ServerContext';
import { AssayProtocolModel } from '../domainproperties/assay/models';
import { EditorModel } from '../editable/models';
import { getSampleOperationConfirmationData } from '../entities/actions';
import { withFormSteps, WithFormStepsProps } from '../forms/FormStep';
import { NotificationsContextProps, useNotificationsContext } from '../notifications/NotificationsContext';

import {
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
} from '../pipeline/constants';

import { SampleOperation, STATUS_DATA_RETRIEVAL_ERROR } from '../samples/constants';
import { getOperationNotAllowedMessage } from '../samples/utils';

import { EditableGridChange } from '../editable/EditableGrid';

import { incrementRowCountMetric } from '../editable/utils';

import { CommentTextArea } from '../forms/input/CommentTextArea';

import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

import { useContainerUser } from '../container/actions';

import { InsufficientPermissionsAlert } from '../permissions/InsufficientPermissionsAlert';

import {
    allowReimportAssayRun,
    checkForDuplicateAssayFiles,
    DuplicateFilesResponse,
    flattenQueryModelRow,
    getRunPropertiesFileName,
    importAssayRun,
    loadSelectedSamples,
    uploadAssayRunFiles,
} from './actions';
import { AssayReimportHeader } from './AssayReimportHeader';
import { AssayWizardModel, AssayUploadOptions } from './AssayWizardModel';
import { BatchPropertiesPanel } from './BatchPropertiesPanel';
import { PLATE_SET_COLUMN, PLATE_TEMPLATE_COLUMN, RUN_PROPERTIES_REQUIRED_COLUMNS } from './constants';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';

import { AssayUploadURLSearchParam, AssayUploadResultModel } from './models';
import { PlatePropertiesPanel } from './PlatePropertiesPanel';
import { RunDataPanel } from './RunDataPanel';
import { RunPropertiesPanel } from './RunPropertiesPanel';

const BASE_FILE_TYPES = ['.csv', '.tsv', '.txt', '.xlsx', '.xls'];
const BATCH_PROPERTIES_GRID_ID = 'assay-batch-details';
const IMPORT_ERROR_ID = 'assay-import-error';

interface OwnProps {
    acceptedPreviewFileFormats?: string;
    allowBulkInsert?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    assayDefinition: AssayDefinitionModel;
    assayProtocol?: AssayProtocolModel;
    // assay design setting
    backgroundUpload?: boolean;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    getIsDirty?: () => boolean;
    jobNotificationProvider?: string;
    loadSelectedSamples?: (
        searchParams: URLSearchParams,
        sampleColumn: QueryColumn,
        containerPath?: string
    ) => Promise<OrderedMap<any, any>>;
    // Not currently used, but related logic retained in component
    maxRows?: number;
    onCancel: () => void;
    onComplete: (response: AssayUploadResultModel, isAsync?: boolean, plateSetId?: number) => void;
    onSave?: (response: AssayUploadResultModel, isAsync?: boolean) => void;
    requiresUserComment?: boolean;
    runId?: string;
    setIsDirty?: (isDirty: boolean) => void;
    showUploadTabs?: boolean;
}

interface AssayImportPanelsBodyProps extends NotificationsContextProps {
    container: Partial<Container>;
    currentPathIsDestinationPath: boolean;
    moduleContext: ModuleContext;
    searchParams: URLSearchParams;
    user: User;
}

type Props = AssayImportPanelsBodyProps & OwnProps & WithFormStepsProps;
type BodyProps = Props & InjectedQueryModels;

interface State {
    comment: string;
    duplicateFileResponse?: DuplicateFilesResponse;
    editorModel: EditorModel;
    error: ReactNode;
    importAgain?: boolean;
    model: AssayWizardModel;
    schemaQuery: SchemaQuery;
    showRenameModal: boolean;
    warning: string;
}

class AssayImportPanelsBody extends Component<BodyProps, State> {
    static defaultProps = {
        acceptedPreviewFileFormats: BASE_FILE_TYPES.join(', '),
        fileSizeLimits: DATA_IMPORT_FILE_SIZE_LIMITS,
        loadSelectedSamples,
        showUploadTabs: true,
        maxRows: MAX_EDITABLE_GRID_ROWS,
    };

    assayUploadTimer: number;

    constructor(props: BodyProps) {
        super(props);
        const schemaQuery = new SchemaQuery(props.assayDefinition.protocolSchemaName, 'Data');
        this.state = {
            comment: undefined,
            editorModel: undefined,
            error: undefined,
            model: new AssayWizardModel({ isInit: false, runId: props.runId }),
            schemaQuery,
            showRenameModal: false,
            warning: undefined,
        };
    }

    componentDidMount(): void {
        const { searchParams, selectStep } = this.props;

        if (searchParams.get(AssayUploadURLSearchParam.dataTab)) {
            const dataTab = parseInt(searchParams.get(AssayUploadURLSearchParam.dataTab), 10);
            if (!isNaN(dataTab)) selectStep(dataTab);
        }

        this.initModel();
    }

    componentDidUpdate(): void {
        const { queryModels, actions, assayDefinition } = this.props;
        const batchId = this.getBatchId();

        if (!queryModels[BATCH_PROPERTIES_GRID_ID] && batchId) {
            actions.addModel(
                {
                    id: BATCH_PROPERTIES_GRID_ID,
                    keyValue: batchId,
                    schemaQuery: new SchemaQuery(assayDefinition.protocolSchemaName, 'Batches'),
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
        const { searchParams } = this.props;
        let runProperties = flattenQueryModelRow(this.getRunPropsQueryModel().getRow());

        // Issue 38711: Need to pre-populate the run properties form with assayRequest if it is present on the URL
        if (searchParams.get(AssayUploadURLSearchParam.assayRequest)) {
            runProperties = runProperties.set('assayRequest', searchParams.get(AssayUploadURLSearchParam.assayRequest));
        }

        if (searchParams.get(AssayUploadURLSearchParam.plateSet)) {
            runProperties = runProperties.set(PLATE_SET_COLUMN, searchParams.get(AssayUploadURLSearchParam.plateSet));
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

    get plateSupportEnabled(): boolean {
        const { assayProtocol, moduleContext } = this.props;
        return isPlatesEnabled(moduleContext) && assayProtocol.plateMetadata === true;
    }

    initModel = async (): Promise<void> => {
        const { assayDefinition, searchParams, runId } = this.props;
        const { schemaQuery } = this.state;
        let plateProperties = Map<string, any>();
        let workflowTask: number;

        if (searchParams.get(AssayUploadURLSearchParam.workflowTaskId)) {
            const _workflowTask = parseInt(searchParams.get(AssayUploadURLSearchParam.workflowTaskId), 10);
            workflowTask = isNaN(_workflowTask) ? undefined : _workflowTask;
        }

        const batchQueryInfo = await getQueryDetails(new SchemaQuery(assayDefinition.protocolSchemaName, 'Batches'));
        const runQueryInfo = await getQueryDetails(new SchemaQuery(assayDefinition.protocolSchemaName, 'Runs'));
        const dataQueryInfo = await getQueryDetails(schemaQuery);

        const { plateColumns, runColumns } = this.getRunColumns(runQueryInfo);
        const runProperties = this.getRunPropertiesMap();

        if (this.plateSupportEnabled && runProperties.get(PLATE_SET_COLUMN)) {
            plateProperties = plateProperties.set(PLATE_SET_COLUMN, runProperties.get(PLATE_SET_COLUMN));
        }

        this.setState(
            {
                model: new AssayWizardModel({
                    // Initialization is done if the assay does not have a sample column and we aren't getting the
                    // run properties to show for reimport
                    isInit: assayDefinition.getSampleColumn() === undefined && this.runAndBatchPropsLoaded(),
                    assayDef: assayDefinition,
                    batchColumns: this.getDomainColumns(AssayDomainTypes.BATCH, batchQueryInfo),
                    plateColumns,
                    plateProperties,
                    runColumns,
                    runId,
                    usePreviousRunFile: this.isReimport(),
                    batchProperties: this.getBatchPropertiesMap(),
                    runProperties,
                    queryInfo: dataQueryInfo,
                    workflowTask,
                }),
            },
            this.onGetQueryDetailsComplete
        );
    };

    getDomainColumns = (domainType: AssayDomainTypes, queryInfo: QueryInfo): OrderedMap<string, QueryColumn> => {
        // Issue 47576: if there are wrapped columns that are marked as userEditable and shownInInsertView, include them in the form / UI
        const { assayDefinition } = this.props;
        let columns = assayDefinition.getDomainColumns(domainType);
        queryInfo?.columns.forEach(c => {
            const shouldInclude = c.wrappedColumnName && c.userEditable && c.shownInInsertView;
            if (shouldInclude) columns = columns.set(c.fieldKey.toLowerCase(), c);
        });
        return columns;
    };

    getRunColumns = (
        runQueryInfo: QueryInfo
    ): { plateColumns: OrderedMap<string, QueryColumn>; runColumns: OrderedMap<string, QueryColumn> } => {
        let runColumns = this.getDomainColumns(AssayDomainTypes.RUN, runQueryInfo);
        let plateColumns = OrderedMap<string, QueryColumn>();

        if (this.plateSupportEnabled) {
            const plateTemplateFieldKey = PLATE_TEMPLATE_COLUMN.toLowerCase();
            if (runColumns.has(plateTemplateFieldKey)) {
                runColumns = runColumns.remove(plateTemplateFieldKey);
            }
            const plateSetFieldKey = PLATE_SET_COLUMN.toLowerCase();
            if (runColumns.has(plateSetFieldKey)) {
                plateColumns = plateColumns.set(plateSetFieldKey, runColumns.get(plateSetFieldKey));
                runColumns = runColumns.remove(plateSetFieldKey);
            }
        }

        return { plateColumns, runColumns };
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
        const { assayDefinition, container, currentPathIsDestinationPath, searchParams } = this.props;
        const sampleColumnData = assayDefinition.getSampleColumn();

        let warning: string;
        const modelUpdates: Partial<AssayWizardModel> = {
            batchProperties: this.getBatchPropertiesMap(),
            isInit: this.runAndBatchPropsLoaded(),
            runProperties: this.getRunPropertiesMap(),
        };

        let hasValidSamples = false;
        if (sampleColumnData) {
            try {
                // If the assay has a sample column look up at Batch, Run, or Result level then we want to retrieve
                // the currently selected samples so we can pre-populate the fields in the wizard with the selected
                // samples.
                // Additionally, we want to pre-populate the fields in the wizard with samples if the job has samples
                // associated with it, and the assay has a sample column.
                const { column, domain } = sampleColumnData;
                const samples = await this.props.loadSelectedSamples(searchParams, column);

                const statusConfirmationData = await getSampleOperationConfirmationData(
                    SampleOperation.AddAssayData,
                    samples.keySeq().toArray()
                );

                // Only one sample can be added at batch or run level, so ignore selected samples if multiple are selected.
                const validSamples = samples
                    .filter((_, key) => statusConfirmationData.isIdActionable(key))
                    .toOrderedMap();

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

                hasValidSamples = validSamples.size > 0;
                if (samples.size > 0) {
                    warning = getOperationNotAllowedMessage(SampleOperation.AddAssayData, statusConfirmationData);
                }
            } catch (e) {
                this.setState({ error: STATUS_DATA_RETRIEVAL_ERROR });
                return;
            }
        }

        if (!currentPathIsDestinationPath) {
            const destinationContainerWarning = ` The assay data will be imported in the ${container.path} folder.`;
            warning = (warning || '') + destinationContainerWarning;
        }

        this.setState(
            state => ({
                model: state.model.merge(modelUpdates) as AssayWizardModel,
                warning,
            }),
            () => this.onInitModelComplete(hasValidSamples)
        );
    };

    onInitModelComplete = async (hasSamples?: boolean): Promise<void> => {
        const { setIsDirty } = this.props;
        const runPropsModel = this.getRunPropsQueryModel();
        const runName = runPropsModel.getRowValue('Name');
        const fileName = getRunPropertiesFileName(runPropsModel.getRow());
        const editorModel = await this.state.model.getInitialEditorModel(this.plateSupportEnabled);

        if (hasSamples) setIsDirty(true);

        // Issue 38237: set the runName and comments for the re-import case
        this.setState(state => {
            const model = state.model.merge({
                runName: this.isReimport() && runName === fileName ? undefined : runName, // Issue 39328
                comment: runPropsModel.getRowValue('Comments') ?? '',
            }) as AssayWizardModel;
            return {
                model,
                editorModel,
            };
        });
    };

    handleDataFileChange = (attachments: Map<string, File>): void => {
        this.props.setIsDirty?.(attachments.size > 0);

        this.setState(state => ({
            error: undefined,
            model: state.model.merge({
                attachedFiles: attachments,
                usePreviousRunFile: false,
            }) as AssayWizardModel,
        }));
    };

    handleDataFileRemove = (): void => {
        this.props.setIsDirty?.(false);

        this.setState(state => ({
            error: undefined,
            model: state.model.merge({
                attachedFiles: Map<string, File>(),
                usePreviousRunFile: false,
            }) as AssayWizardModel,
        }));
    };

    handleResultsFileChange = (attachments: Map<string, File>): void => {
        this.setResultsFiles(attachments);
    };

    handleResultsFileRemove = (_, updatedFiles: Map<string, File>): void => {
        this.setResultsFiles(updatedFiles);
    };

    setResultsFiles = (attachments: Map<string, File>): void => {
        this.props.setIsDirty?.(true);
        this.setState(state => ({
            model: state.model.merge({
                resultsFiles: attachments,
            }) as AssayWizardModel,
        }));
    };

    handleBatchChange = (fieldValues: any): void => {
        const values = { ...this.state.model.batchProperties.toObject(), ...fieldValues };

        this.props.setIsDirty?.(true);

        const cleanedValues = Object.keys(values).reduce((result, key) => {
            const value = values[key];
            if (value !== undefined) {
                result[key] = value;
            }
            return result;
        }, {});

        this.handleChange('batchProperties', OrderedMap<string, any>(cleanedValues));
    };

    handleWorkflowTaskChange = (name: string, value: any): void => {
        this.setState(state => ({
            model: state.model.merge({
                workflowTask: value,
            }) as AssayWizardModel,
        }));
    };

    handleRunChange = (fieldValues: any, isChanged?: boolean): void => {
        const values = { ...this.state.model.runProperties.toObject(), ...fieldValues };
        let { comment, runName } = this.state.model;

        const cleanedValues = Object.keys(values).reduce((result, key) => {
            const value = values[key];
            if (key === 'runname') {
                runName = value;
            } else if (key === 'comment') {
                comment = value;
            } else if (key !== 'workflowtask' && value !== undefined) {
                result[key] = value;
            }
            return result;
        }, {});

        if (isChanged) this.props.setIsDirty?.(true);

        this.handleChange('runProperties', OrderedMap<string, any>(cleanedValues), () => {
            this.setState(state => ({
                model: state.model.merge({
                    runName,
                    comment,
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

    checkForDuplicateFiles = async (importAgain: boolean): Promise<void> => {
        const { container } = this.props;

        try {
            const duplicateFileResponse = await checkForDuplicateAssayFiles(
                this.state.model.attachedFiles.keySeq().toArray(),
                container.path
            );

            if (duplicateFileResponse.duplicate) {
                this.setState({ duplicateFileResponse, importAgain, showRenameModal: true });
            } else {
                this.onFinish(importAgain);
            }
        } catch (e) {
            this.setState({
                error: getActionErrorMessage('There was a problem checking for duplicate file names.', 'assay run'),
            });
        }
    };

    save = (importAgain: boolean): void => {
        if (this.state.model.isFilesTab(this.props.currentStep)) {
            this.checkForDuplicateFiles(importAgain);
        } else {
            this.onFinish(importAgain);
        }
    };

    onImport = (): void => this.save(false);

    onSaveAndImportAgain = (): void => this.save(true);

    getBackgroundJobDescription = (options: AssayDOM.ImportRunOptions): string => {
        const { assayDefinition } = this.props;
        return assayDefinition.name + (options.name ? ' - ' + options.name : '');
    };

    onFinish = async (importAgain: boolean): Promise<void> => {
        const {
            container,
            currentStep,
            onSave,
            jobNotificationProvider,
            assayProtocol,
            searchParams,
            dismissNotifications,
        } = this.props;
        const { model, comment } = this.state;
        const data = model.prepareFormData(currentStep, this.state.editorModel, container.path);
        this.setModelState(true, undefined);
        dismissNotifications();

        try {
            const processedData = await uploadAssayRunFiles(data);

            const backgroundUpload = assayProtocol?.backgroundUpload;
            let forceAsync = false;
            if (!backgroundUpload && assayProtocol?.allowBackgroundUpload) {
                const useAsync = searchParams.get(AssayUploadURLSearchParam.useAsync) === 'true';
                const asyncFileSize = useAsync ? 1 : BACKGROUND_IMPORT_MIN_FILE_SIZE;
                const asyncRowSize = useAsync ? 1 : BACKGROUND_IMPORT_MIN_ROW_SIZE;
                if (
                    (processedData.maxFileSize && processedData.maxFileSize >= asyncFileSize) ||
                    (processedData.maxRowCount && processedData.maxRowCount >= asyncRowSize)
                ) {
                    forceAsync = true;
                }
            }

            const response = await importAssayRun({
                ...processedData,
                forceAsync,
                jobDescription: this.getBackgroundJobDescription(data),
                jobNotificationProvider,
                auditUserComment: comment,
                containerPath: container.path,
            });
            if (data.dataRows?.length) {
                incrementRowCountMetric('assayData', data.dataRows?.length, false);
            }

            this.props.setIsDirty?.(false);
            if (importAgain && onSave) {
                this.onSuccessContinue(response, backgroundUpload || forceAsync);
            } else {
                this.onSuccessComplete(response, data, backgroundUpload || forceAsync);
            }
        } catch (e) {
            let error: ReactNode;
            const errorPrefix = 'There was a problem importing the assay results.';
            const message = resolveErrorMessage(e);

            if (message) {
                error = `${errorPrefix} ${message}`;
            } else {
                error = getActionErrorMessage(errorPrefix, 'referenced samples or assay design', false);
            }

            this.setModelState(false, error);
        }
    };

    onSuccessContinue = async (response: AssayUploadResultModel, isAsync?: boolean): Promise<void> => {
        this.props.onSave?.(response, isAsync);
        const editorModel = await this.state.model.getInitialEditorModel(this.plateSupportEnabled);

        // Reset the data for the AssayWizardModel
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
            return { editorModel, model };
        });
    };

    onSuccessComplete = (response: AssayUploadResultModel, data: AssayUploadOptions, isAsync?: boolean): void => {
        this.setModelState(false, undefined);
        this.props.onComplete(response, isAsync, data.properties[PLATE_SET_COLUMN]);
    };

    setModelState = (isSubmitting: boolean, errorMsg: ReactNode): void => {
        this.setState(
            state => ({
                error: errorMsg,
                model: state.model.merge({ isSubmitting }) as AssayWizardModel,
            }),
            () => {
                if (errorMsg) {
                    document.querySelector('#' + IMPORT_ERROR_ID)?.scrollIntoView();
                }
            }
        );
    };

    getProgressSizeEstimate = (): number => {
        const { model } = this.state;
        if (!model.isSubmitting) {
            return;
        }

        const data = model.prepareFormData(this.props.currentStep, this.state.editorModel);

        if (data.files?.length > 0) {
            // the data file (i.e. attachedFiles) will be processed so the size of the file gets much greater weight
            // than the results files that just need to be sent to the server and saved to the file system
            return model.getTotalAttachedFilesSize() / 5 + model.getTotalResultsFilesSize() / 100_000;
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
        this.setState({ showRenameModal: false, duplicateFileResponse: undefined, importAgain: undefined }, () =>
            this.onFinish(importAgain)
        );
    };

    onCommentChange = (comment: string): void => {
        this.setState({ comment });
    };

    onGridChange: EditableGridChange = (event, editorModelChanges): void => {
        this.setState(state => {
            this.props.setIsDirty?.(true);
            return { editorModel: state.editorModel.applyChanges(editorModelChanges) };
        });
    };

    render(): ReactNode {
        const {
            container,
            currentStep,
            onCancel,
            requiresUserComment,
            acceptedPreviewFileFormats,
            allowBulkRemove,
            allowBulkInsert,
            allowBulkUpdate,
            maxRows,
            moduleContext,
            onSave,
            showUploadTabs,
            fileSizeLimits,
            user,
            getIsDirty,
            setIsDirty,
        } = this.props;
        const { comment, duplicateFileResponse, editorModel, model, showRenameModal, warning } = this.state;
        const runPropsModel = this.getRunPropsQueryModel();
        const resultsFilesCount = model.getResultsFiles().length;

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
        const operation = isReimport ? Operation.update : Operation.insert;
        const runContainerId = runPropsModel.getRowValue('Folder');
        const plateSupportEnabled = this.plateSupportEnabled;

        if (isReimport && !allowReimportAssayRun(user, runContainerId, container.id)) {
            const runName = runPropsModel.getRowValue('Name');
            return (
                <Alert>
                    The run "{runName}" cannot be re-imported into this folder. This run is declared in a
                    different folder and re-import of runs is only supported within the same folder.
                </Alert>
            );
        }

        const showSaveAgainBtn = !isReimport && onSave !== undefined;
        const disabledSave =
            model.isSubmitting ||
            !model.hasData(currentStep, editorModel) ||
            (model.isGridTab(currentStep) && editorModel?.hasErrors) ||
            (!isReimport && !!getIsDirty && !getIsDirty?.()) ||
            (isReimport && requiresUserComment && !comment?.trim()?.length);
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
                <Alert bsStyle="warning">{warning}</Alert>
                <BatchPropertiesPanel
                    containerPath={container.path}
                    model={model}
                    operation={operation}
                    onChange={this.handleBatchChange}
                />
                <RunPropertiesPanel
                    model={model}
                    operation={operation}
                    onChange={this.handleRunChange}
                    onWorkflowTaskChange={this.handleWorkflowTaskChange}
                />
                {plateSupportEnabled && (
                    <PlatePropertiesPanel
                        model={model}
                        operation={operation}
                        onChange={this.handleRunChange}
                        containerPath={container.path}
                    />
                )}
                <RunDataPanel
                    acceptedPreviewFileFormats={acceptedPreviewFileFormats}
                    allowBulkRemove={allowBulkRemove}
                    allowBulkInsert={allowBulkInsert}
                    allowBulkUpdate={allowBulkUpdate}
                    containerPath={container.path}
                    currentStep={currentStep}
                    editorModel={editorModel}
                    fileSizeLimits={fileSizeLimits}
                    maxEditableGridRowMsg={`A max of ${maxRows?.toLocaleString()} rows are allowed. Please use the 'Import Data from File' tab if you need to import more than ${maxRows?.toLocaleString()} rows.`}
                    maxRows={maxRows}
                    onDataFileChange={this.handleDataFileChange}
                    onDataFileRemoval={this.handleDataFileRemove}
                    onResultsFileChange={this.handleResultsFileChange}
                    onResultsFileRemoval={this.handleResultsFileRemove}
                    onGridChange={this.onGridChange}
                    operation={operation}
                    onTextChange={this.handleDataTextChange}
                    plateSupportEnabled={plateSupportEnabled}
                    runPropertiesRow={runProps}
                    showTabs={showUploadTabs}
                    wizardModel={model}
                    getIsDirty={getIsDirty}
                    setIsDirty={setIsDirty}
                />
                <Alert id={IMPORT_ERROR_ID}>{this.state.error}</Alert>
                <FormButtons>
                    <button className="btn btn-default" onClick={onCancel} type="button">
                        Cancel
                    </button>
                    {isReimport && (
                        <CommentTextArea
                            actionName="Update"
                            containerClassName="inline-comment"
                            onChange={this.onCommentChange}
                            requiresUserComment={requiresUserComment}
                            inline
                        />
                    )}
                    {showSaveAgainBtn && (
                        <button
                            className="btn btn-default"
                            type="submit"
                            onClick={this.onSaveAndImportAgain}
                            disabled={disabledSave}
                        >
                            {model.isSubmitting ? 'Saving...' : 'Save and Import Another Run'}
                        </button>
                    )}
                    <button type="submit" className="btn btn-success" onClick={this.onImport} disabled={disabledSave}>
                        {model.isSubmitting ? 'Importing...' : isReimport ? 'Re-Import' : 'Import'}
                    </button>
                </FormButtons>
                <Progress
                    estimate={this.getProgressSizeEstimate()}
                    modal
                    title={isReimport ? 'Re-importing assay run' : 'Importing assay run'}
                    toggle={model.isSubmitting}
                >
                    {resultsFilesCount > 0 && (
                        <p>
                            Upload includes {Utils.pluralBasic(resultsFilesCount, 'additional file')}. Please stay on
                            this page until upload finishes.
                        </p>
                    )}
                </Progress>
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

const AssayImportPanelWithQueryModels = withQueryModels<Props>(AssayImportPanelsBody);

const AssayImportPanelsBodyImpl: FC<Props> = memo(props => {
    const { assayDefinition, container, runId } = props;
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const { requiresUserComment } = useDataChangeCommentsRequired();

    const key = [runId, assayDefinition.protocolSchemaName].join('|');
    const schemaQuery = useMemo(
        () => new SchemaQuery(assayDefinition.protocolSchemaName, 'Runs'),
        [assayDefinition.protocolSchemaName]
    );
    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            model: {
                containerPath: container.path,
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
        [container.path, runId, schemaQuery]
    );

    return (
        <AssayImportPanelWithQueryModels
            {...props}
            autoLoad
            createNotification={createNotification}
            dismissNotifications={dismissNotifications}
            key={key}
            queryConfigs={queryConfigs}
            requiresUserComment={requiresUserComment}
        />
    );
});

AssayImportPanelsBodyImpl.displayName = 'AssayImportPanelsBodyImpl';

// This initializes the context (container, user) for this panel. If a URL parameter "destinationContainerId" is
// present, then the panel will load out with that container/user context. Defaults to the server context container/user.
const AssayImportPanelContextLoader: FC<Props> = memo(props => {
    const [searchParams] = useSearchParams();
    const serverContext = useServerContext();

    const destinationContainerId = searchParams.get(AssayUploadURLSearchParam.destinationContainerId);
    const destinationContainerUser = useContainerUser(destinationContainerId);

    if (destinationContainerId) {
        if (!destinationContainerUser.isLoaded) {
            return <LoadingSpinner />;
        } else if (destinationContainerUser.error) {
            return <Alert>{destinationContainerUser.error}</Alert>;
        }
    }

    const container = destinationContainerUser?.container ?? serverContext.container;
    const user = destinationContainerUser?.user ?? serverContext.user;
    const currentPathIsDestinationPath = !destinationContainerUser || serverContext.container.id === container.id;

    if (!user.hasInsertPermission()) {
        return (
            <InsufficientPermissionsAlert
                message={`You do not have permissions to import assay data into ${container.path}.`}
            />
        );
    }

    return (
        <AssayImportPanelsBodyImpl
            {...props}
            container={container}
            currentPathIsDestinationPath={currentPathIsDestinationPath}
            moduleContext={serverContext.moduleContext}
            searchParams={searchParams}
            user={user}
        />
    );
});

AssayImportPanelContextLoader.displayName = 'AssayImportPanelContainerLoader';

// TODO: This should be migrated to @labkey/premium and consolidated with AssayUploadPage.
export const AssayImportPanels = withFormSteps(AssayImportPanelContextLoader, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Files,
    hasDependentSteps: false,
});
