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
import * as React from 'react'
import { Button } from 'react-bootstrap';
import { List, Map, OrderedMap } from 'immutable'
import { Utils } from '@labkey/api'
import {
    Alert,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayUploadTabs,
    getActionErrorMessage,
    LoadingSpinner,
    Progress,
    QueryGridModel,
    SchemaQuery,
    WizardNavButtons
} from '@glass/base';

import { Location } from "../../util/URL"
import { loadSelectedSamples } from "../samples/actions";
import {
    checkForDuplicateAssayFiles,
    DuplicateFilesResponse,
    getRunPropertiesModel,
    getRunPropertiesRow,
    importAssayRun,
    uploadAssayRunFiles
} from "./actions";
import { AssayUploadResultModel, AssayWizardModel, IAssayUploadOptions } from "./models";
import { withFormSteps, WithFormStepsProps } from "../forms/FormStep"
import { getQueryGridModel, removeQueryGridModel } from "../../global";
import { AssayUploadGridLoader } from "./AssayUploadGridLoader";
import { getStateQueryGridModel } from "../../models";
import { gridInit } from "../../actions";
import { getQueryDetails } from "../../query/api";
import { BatchPropertiesPanel } from "./BatchPropertiesPanel";
import { RunPropertiesPanel } from "./RunPropertiesPanel";
import { RunDataPanel } from "./RunDataPanel";
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';
import { AssayReimportHeader } from './AssayReimportHeader';

let assayUploadTimer: number;
const INIT_WIZARD_MODEL = new AssayWizardModel({isInit: false});

interface OwnProps {
    assayDefinition: AssayDefinitionModel
    runId?: string
    onCancel: () => any
    onComplete: (response: AssayUploadResultModel) => any
    onSave?: (response: AssayUploadResultModel) => any
    acceptedPreviewFileFormats?: string
    location?: Location
    allowBulkRemove?: boolean
    allowBulkInsert?: boolean
}

type Props = OwnProps & WithFormStepsProps;

interface State {
    schemaQuery: SchemaQuery
    model: AssayWizardModel,
    showRenameModal : boolean
    dupData?: DuplicateFilesResponse
}

class AssayImportPanelsImpl extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            schemaQuery: SchemaQuery.create(props.assayDefinition.protocolSchemaName, 'Data'),
            model: AssayImportPanelsImpl.getInitWizardModel(props),
            showRenameModal: false
        }
    }

    static getInitWizardModel(props: Props) : AssayWizardModel {
        return INIT_WIZARD_MODEL.merge({runId: props.runId}) as AssayWizardModel
    }

    isReimport() : boolean {
        return this.props.runId !== undefined
    }

    componentWillMount() {
        const { location, selectStep } = this.props;

        if (location && location.query && location.query.dataTab) {
            selectStep(parseInt(location.query.dataTab));
        }

        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        if (this.props.assayDefinition.protocolSchemaName !== nextProps.assayDefinition.protocolSchemaName) {
            // remove QueryGridModel just in case the URL params change back to this assay
            removeQueryGridModel(this.getDataGridModel());

            this.setState(() => ({
                schemaQuery: SchemaQuery.create(nextProps.assayDefinition.protocolSchemaName, 'Data'),
                model: AssayImportPanelsImpl.getInitWizardModel(nextProps)
            }), () => {
                this.initModel(nextProps);
            });
        }
        else if (this.isReimport() && !this.state.model.isInit && this.getRunPropertiesModel().isLoaded) {
            this.setState((state) => ({
                model: state.model.merge({
                    isInit: true,
                    runProperties: this.getRunPropertiesRow()
                }) as AssayWizardModel
            }), this.onInitModelComplete);
        }
    }

    componentWillUnmount() {
        // remove the QueryGridModel from the global state so it will reload for new assay on next mount
        removeQueryGridModel(this.getDataGridModel());
        removeQueryGridModel(this.getRunPropertiesModel());
    }

    getRunPropertiesModel() : QueryGridModel {
        return getRunPropertiesModel(this.props.assayDefinition, this.props.runId);
    }

    getRunPropertiesRow() :  Map<string, any> {
        const queryData = getRunPropertiesRow(this.props.assayDefinition, this.props.runId);
        if (queryData) {
            // TODO make the consumers of this row data able to handle the queryData instead of
            // having to create the key -> value map via reduction.
            return queryData.reduce((map, v, k) => {
                let valueMap = v;
                if (List.isList(v)) {
                    if (v.size > 1) {
                        console.warn("Multiple values for field '" + k + "'.  Using the last.");
                    }
                    valueMap = v.get(v.size - 1);
                }
                if (valueMap && valueMap.has('value') && valueMap.get('value')) {
                    return map.set(k, valueMap.get('value').toString())
                }
                return map;
            }, Map<string, any>());
        }
        return Map<string, any>();
    }

    initRerunModel() {
        if (this.isReimport()) {
            const runPropertiesModel = this.getRunPropertiesModel();
            gridInit(runPropertiesModel, true, this);
        }
    }

    isRunPropertiesInit() {
        // if not reimporting, we don't need run properties to display in the form
        return !this.isReimport() || this.getRunPropertiesModel().isLoaded;
    }

    initModel(props: Props) {
        const { assayDefinition, runId } = props;

        if (this.state.model.isInit) {
            return;
        }

        this.initRerunModel();

        // need to query for the assay data table QueryInfo in order to init the AssayWizardModel
        getQueryDetails(this.state.schemaQuery)
            .then(queryInfo => {
                const sampleColumnData = assayDefinition.getSampleColumn();
                this.setState(() => ({
                    model: new AssayWizardModel({
                        // we are done here if the assay does not have a sample column and we aren't getting the run properties to show for reimport
                        isInit: sampleColumnData === undefined && this.isRunPropertiesInit(),
                        assayDef: assayDefinition,
                        batchColumns: assayDefinition.getDomainColumns(AssayDomainTypes.BATCH),
                        runColumns: assayDefinition.getDomainColumns(AssayDomainTypes.RUN),
                        runId,
                        runProperties: this.getRunPropertiesRow(),
                        queryInfo
                    })
                }), this.onGetQueryDetailsComplete)
            });
    }

    onGetQueryDetailsComplete() {
        const { assayDefinition, location } = this.props;
        const sampleColumnData = assayDefinition.getSampleColumn();

        if (sampleColumnData && location) {
            // If the assay has a sample column look up at Batch, Run, or Result level then we want to retrieve
            // the currently selected samples so we can pre-populate the fields in the wizard with the selected
            // samples.
            loadSelectedSamples(location, sampleColumnData.column).then((samples) => {
                // Only one sample can be added at batch or run level, so ignore selected samples if multiple are selected.
                let runProperties = this.getRunPropertiesRow();
                let batchProperties = Map<string, any>();
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

                this.setState((state) => ({
                    model: state.model.merge({
                        isInit : this.isRunPropertiesInit(),
                        selectedSamples: samples,
                        batchProperties,
                        runProperties
                    }) as AssayWizardModel
                }), this.onInitModelComplete);
            });
        }
        else {
            this.setState((state) => ({
                model: state.model.merge({
                    isInit : this.isRunPropertiesInit(),
                    runProperties: this.getRunPropertiesRow()
                }) as AssayWizardModel
            }), this.onInitModelComplete);
        }
    }

    onInitModelComplete() {
        // only init the gridModel after the state has been set since it uses the AssayWizardModel in the grid loader
        gridInit(this.getDataGridModel(), true, this);
    }

    getDataGridModel(): QueryGridModel {
        const gridModel = getStateQueryGridModel('assay-upload-editable-grid', this.state.schemaQuery, () => ({
            loader: new AssayUploadGridLoader(this.state.model, this.props.assayDefinition),
            allowSelection: false,
            editable: true,
            sortable: false
        }));

        return getQueryGridModel(gridModel.getId()) || gridModel;
    }

    handleFileChange = (attachments: Map<string, File>) => {
        this.setState((state) => ({
            model: state.model.merge({
                attachedFiles: attachments,
                errorMsg: undefined,
                usePreviousRunFile: false,
            }) as AssayWizardModel
        }));
    };

    handleFileRemove = (attachmentName: string) => {
        this.setState((state) => {
            return {
                model : state.model.merge({
                    errorMsg: undefined,
                    attachedFiles: Map<string, File>(),
                    usePreviousRunFile: false
                }) as AssayWizardModel
            }
        });
    };

    handleBatchChange = (fieldValues: any) => {
        // Here we have to merge incoming values with model.batchProperties because of the way Formsy works.
        // FileInput fields are not Formsy components, so when they send updates they only send the value for their
        // field. When formsy sends updates it sends the entire form (but not file fields). So we need to merge
        // with the known values and then both Formsy and FileInput fields can work together.
        const values = {
            ...this.state.model.batchProperties.toObject(),
            ...fieldValues,
        };

        this.handleChange('batchProperties', Map<string, any>(values ? values : {}));
    };

    handleRunChange = (fieldValues: any) => {
        // See the note in handleBatchChange for why this method exists.
        const values = {
            ...this.state.model.runProperties.toObject(),
            ...fieldValues,
        };

        let comment = this.state.model.comment;
        let runName = this.state.model.runName;

        const cleanedValues = Object.keys(values).reduce((result, key) => {
            const value = values[key];
            if (key === 'runname') {
                runName = value;
            } else if (key === 'comment') {
                comment = value
            } else if (value !== undefined) {
                result[key] = value;
            }
            return result;
        }, {});

        this.handleChange('runProperties', OrderedMap<string, any>(cleanedValues), () => {
            this.setState((state) => ({
                model: state.model.merge({
                    runName,
                    comment,
                }) as AssayWizardModel
            }));
        });
    };

    handleDataTextChange = (inputName: string, fieldValues: any) => {
        // use '' to clear out text area
        this.handleChange('dataText', fieldValues != undefined ? fieldValues : '');
    };

    handleChange(prop: string, value: any, onComplete?: Function) {
        clearTimeout(assayUploadTimer);

        assayUploadTimer = window.setTimeout(() => {
            assayUploadTimer = null;
            this.setState((state) => ({
                model: state.model.set(prop, value) as AssayWizardModel
            }));

            if (onComplete) {
                onComplete();
            }
        }, 250);
    }

    checkForDuplicateFiles = () => {
        checkForDuplicateAssayFiles(this.state.model.attachedFiles.keySeq().toArray()).then((dupData) => {
            if (dupData.duplicate) {
                this.setState(() => ({
                    showRenameModal: true,
                    dupData
                }));
            }
            else {
                this.onFinish(false);
            }
        }).catch((reason) => {
            this.setState((state) => ({
                model: state.model.set('errorMsg', getActionErrorMessage("There was in a problem checking for duplicate file names.", "assay run")) as AssayWizardModel
            }));
        });
    };

    onFinish(importAgain: boolean) {
        const { currentStep, onSave } = this.props;
        const { model } = this.state;
        this.setModelState(true, undefined);
        const data = model.prepareFormData(currentStep, this.getDataGridModel());

        uploadAssayRunFiles(data).then((processedData: IAssayUploadOptions) => {
            importAssayRun(processedData)
                .then((response: AssayUploadResultModel) => {
                    if (importAgain && onSave) {
                        this.onSuccessContinue(response);
                    }
                    else {
                        this.onSuccessComplete(response);
                    }
                })
                .catch((reason) => {
                    console.error("Problem importing assay run", reason);
                    this.onFailure(reason.exception || getActionErrorMessage("There was a problem importing the assay results.", "assay design"))
                });
        }).catch((reason) => {
            console.error("Problem uploading assay run files", reason);
            this.onFailure(reason.exception || getActionErrorMessage("There was a problem uploading the data files.", "assay design"));
        });
    };

    onSuccessContinue = (response: AssayUploadResultModel) => {
        if (this.props.onSave) {
            this.props.onSave(response);
        }

        // update the local state model so that it clears the data
        this.setState((state) => ({
            model: state.model.merge({
                batchId: response.batchId,
                lastRunId: response.runId,
                isSubmitting: false,
                comment: '', // textarea doesn't clear for undefined
                dataText: '',
                runName: undefined,
                attachedFiles: Map<string, File>(),
                runProperties: Map<string, any>()
                // Note: leave batchProperties alone since those are preserved in this case
            }) as AssayWizardModel
        }), () => {
            // since the onSave might invalidated our grid, need to call gridInit again
            window.setTimeout(() => {gridInit(this.getDataGridModel(), true, this);}, 100);
        });
    };

    onSuccessComplete = (response: AssayUploadResultModel) => {
        this.setModelState(false, undefined);
        this.props.onComplete(response);
    };

    onFailure = (error: any) => {
        this.setModelState(false, error);
    };

    setModelState(isSubmitting: boolean, errorMsg: React.ReactNode) {
        this.setState((state) => {
            return {
                model : state.model.merge({
                    isSubmitting,
                    errorMsg,
                    attachedFiles: isSubmitting ? state.model.attachedFiles : Map<string, File>()
                }) as AssayWizardModel
            }
        });
    }

    getProgressSizeEstimate(): number {
        const { model } = this.state;
        if (!model.isSubmitting) {
            return;
        }

        const data = model.prepareFormData(this.props.currentStep, this.getDataGridModel());
        if (data.files && data.files.length > 0) {
            return data.files[0].size * .2;
        }
        else if (data.dataRows) {
            if (Utils.isArray(data.dataRows)) {
                return data.dataRows.length * 10;
            }
            else if (data.dataRows.size) {
                return data.dataRows.size * 10;
            }
        }
    }

    onCancelRename = () => {
        this.setState(() => ({showRenameModal: false}));
    };

    onRenameConfirm = () => {
        if (this.state.showRenameModal) {
            this.setState(() => ({showRenameModal: false}));
        }
        this.onFinish(false)
    };

    renderFileRenameModal() {
        return (
            <ImportWithRenameConfirmModal
                onConfirm={this.onRenameConfirm}
                onCancel={this.onCancelRename}
                originalName={this.state.model.attachedFiles.keySeq().get(0)}
                newName={this.state.dupData.newFileNames[0]}
            />
        )
    }

    render() {
        const { currentStep, onCancel, acceptedPreviewFileFormats, allowBulkRemove, allowBulkInsert, onSave } = this.props;
        const { model, showRenameModal } = this.state;

        if (!model.isInit) {
            return <LoadingSpinner/>
        }

        const dataGridModel = this.getDataGridModel();
        return (
            <>
                {this.isReimport() && this.getRunPropertiesModel().isLoaded && <AssayReimportHeader assay={model.assayDef} replacedRunProperties={this.getRunPropertiesRow()}/>}
                <BatchPropertiesPanel model={model} onChange={this.handleBatchChange} />
                <RunPropertiesPanel model={model} onChange={this.handleRunChange} />
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
                />
                {model.errorMsg && <Alert bsStyle="danger">{model.errorMsg}</Alert>}
                <WizardNavButtons
                    cancel={onCancel}
                    containerClassName=""
                    includeNext={false}
                >
                    {onSave &&
                        <Button
                                type="submit"
                                onClick={this.onFinish.bind(this, true)}
                                disabled={model.isSubmitting}>
                            {model.isSubmitting ? 'Saving...' : 'Save And Import Another Run'}
                        </Button>
                    }
                    <Button
                        type="submit"
                        bsStyle={"success"}
                        onClick={this.checkForDuplicateFiles}
                        disabled={model.isSubmitting || !model.hasData(currentStep, dataGridModel)}>
                        {onSave
                            ? (model.isSubmitting ? 'Saving...' : 'Save and Finish')
                            : (model.isSubmitting ? 'Importing...' : (this.isReimport() ? 'Reimport' : 'Import'))
                        }
                    </Button>
                </WizardNavButtons>
                <Progress
                    estimate={this.getProgressSizeEstimate()}
                    modal={true}
                    title={this.isReimport() ? "Reimporting assay run" : "Importing assay run"}
                    toggle={model.isSubmitting}/>
                {showRenameModal && (this.renderFileRenameModal())}
            </>
        )
    }
}

export const AssayImportPanels = withFormSteps<Props>(AssayImportPanelsImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false
});