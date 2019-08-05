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
import Formsy from 'formsy-react';
import { Textarea } from 'formsy-react-components';
import { Map } from 'immutable';
import {
    Alert,
    AssayUploadTabs,
    FileAttachmentForm,
    getActionErrorMessage,
    getServerFilePreview,
    InferDomainResponse,
    LoadingSpinner,
    QueryGridModel
} from "@glass/base";

import { AssayWizardModel } from "./models";
import { EditableGridPanel } from "../../components/editable/EditableGridPanel";
import { handleTabKeyOnTextArea } from "../../components/forms/actions";
import { FormStep, FormTabs } from "../forms/FormStep";
import { checkForDuplicateAssayFiles, DuplicateFilesResponse, getRunPropertiesRow } from './actions';
import { ImportWithRenameConfirmModal } from './ImportWithRenameConfirmModal';

const TABS = ['Upload Files', 'Copy-and-Paste Data', 'Enter Data Into Grid'];

interface Props {
    currentStep: number
    wizardModel: AssayWizardModel
    gridModel: QueryGridModel
    onRenameConfirm?: () => any
    onFileChange: (attachments: Map<string, File>) => any
    onFileRemoval: (attachmentName: string) => any
    onTextChange: (inputName: string, value: any) => any
    acceptedPreviewFileFormats?: string
    fullWidth?: boolean
    allowBulkRemove?: boolean
    allowBulkInsert?: boolean
}

interface PreviousRunData {
    isLoaded?: boolean
    isLoading?: boolean
    data?: InferDomainResponse
    fileName?: string
}

interface State {
    attachments?: Map<string, File>
    showRenameModal : boolean
    dupData?: DuplicateFilesResponse
    message?: React.ReactNode
    messageStyle?: string
    previousRunData?: PreviousRunData
}

export class RunDataPanel extends React.Component<Props, State> {

    private static previewCount = 3;

    static defaultProps = {
        fullWidth: true,
        allowBulkRemove: false,
        allowBulkInsert: false
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            showRenameModal: false,
            previousRunData : {
                isLoaded: false,
                isLoading: false
            },
            messageStyle: 'danger'
        }
    }

    isRerun() {
        return this.props.wizardModel.runId !== undefined;
    }

    componentWillMount() {
        this.initPreviewData();
    }

    componentWillReceiveProps(nextProps: Props) {
        this.initPreviewData();
    }

    initPreviewData() {
        if (!this.isRerun() || this.state.previousRunData.isLoaded || this.state.previousRunData.isLoading) {
           return;
        }

        const { gridModel, wizardModel } = this.props;

        if (wizardModel.isInit  && gridModel && gridModel.isLoaded) {
            const row = getRunPropertiesRow(this.props.wizardModel.assayDef, this.props.wizardModel.runId);
            console.log("getPreviewData", row.toJS());
            if (row.has("DataOutputs")) {
                const outputs = row.get('DataOutputs');
                if (outputs.size > 1) {
                    console.warn("More than one data output for this run.  Using the last.");
                }

                getServerFilePreview(outputs.getIn([outputs.size -1, "value"]),  RunDataPanel.previewCount).then((response) => {
                    this.setState(() => ({
                            previousRunData: {
                                isLoaded: true,
                                isLoading: false,
                                data: response,
                                fileName: outputs.getIn([outputs.size -1, 'displayValue'])
                            }
                        }
                    ));
                }).catch((reason) => {
                    this.setState(() => ({
                        message: "There was a problem retrieving the current run's data for previewing.  Re-import should still be possible.",
                        messageStyle: "warning",
                        previousRunData: {
                            isLoaded: true,
                            isLoading: false
                        }
                    }));
                });
            }
        }
        else {
            console.log("Not yet loaded.  Can't get preview.");
        }
    }

    resetState = () => {
        this.setState( () => ({
            message: undefined,
            attachments: undefined,
            dupData: undefined,
            previousRunData: {
                isLoaded: false,
                isLoading: false
            }
        }));
    };

    onCancelRename = () => {
        this.setState(() => ({showRenameModal: false}));
    };

    onFileRemove = (attachmentName: string) => {
        this.resetState();
        return this.props.onFileRemoval(attachmentName);
    };

    onRenameConfirm = () => {
        if (this.state.showRenameModal) {
            this.setState(() => ({showRenameModal: false}));
        }
        if (this.props.onRenameConfirm) {
            this.props.onRenameConfirm();
        }
    };

    renderFileRenameModal() {
        return (
            <ImportWithRenameConfirmModal
                onConfirm={this.onRenameConfirm}
                onCancel={this.onCancelRename}
                originalName={this.state.attachments.keySeq().get(0)}
                newName={this.state.dupData.newFileNames[0]}
            />
        )
    }

    checkForDuplicateFiles = (attachments: Map<string, File>) => {
        this.props.onFileChange(attachments);
        checkForDuplicateAssayFiles(attachments.keySeq().toArray()).then((dupData) => {
            if (dupData.duplicate) {
                this.setState(() => ({
                   attachments,
                   showRenameModal: true,
                   dupData
                }));
            }
        }).catch((reason) => {
           this.setState(() => ({
               message: getActionErrorMessage("There was an error retrieving assay run data.", "assay run")
           }));
        })
    };

    onTabChange = () => {
        this.resetState();
    };

    render() {
        const { currentStep, gridModel, wizardModel, onTextChange, acceptedPreviewFileFormats, fullWidth, allowBulkRemove, allowBulkInsert } = this.props;
        const { showRenameModal, message, messageStyle } = this.state;
        const isLoading = !wizardModel.isInit || !gridModel || !gridModel.isLoaded;

        return (
            <div className={"panel panel-default " + (fullWidth ? "full-width" : "")}>
                <div className="panel-heading">
                    Results
                </div>
                <div className="panel-body">
                    {isLoading ? <LoadingSpinner/>
                        : <>
                            <FormTabs tabs={TABS} onTabChange={this.onTabChange}/>
                            <Alert bsStyle={messageStyle}>
                                {message}
                            </Alert>
                            <div className="row">
                                <div className="col-sm-12">
                                    <FormStep stepIndex={AssayUploadTabs.Files}>
                                        <FileAttachmentForm
                                            allowDirectories={false}
                                            allowMultiple={false}
                                            showLabel={false}
                                            initialFileNames={this.state.previousRunData && this.state.previousRunData.fileName ? [this.state.previousRunData.fileName] : []}
                                            onFileChange={this.checkForDuplicateFiles}
                                            onFileRemoval={this.onFileRemove}
                                            templateUrl={wizardModel.assayDef.templateLink}
                                            previewGridProps={acceptedPreviewFileFormats && {
                                                previewCount: RunDataPanel.previewCount,
                                                acceptedFormats: acceptedPreviewFileFormats,
                                                initialData: this.state.previousRunData.data
                                            }}
                                        />
                                    </FormStep>
                                    <FormStep stepIndex={AssayUploadTabs.Copy}>
                                        <Formsy>
                                            <Textarea
                                                changeDebounceInterval={0}
                                                cols={-1}
                                                elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-12']}
                                                label=''
                                                labelClassName={[{'col-sm-3': false}, 'hidden']}
                                                name="rundata"
                                                onChange={(field, value) => onTextChange('text', value)}
                                                onKeyDown={handleTabKeyOnTextArea}
                                                placeholder="Paste in a tab-separated set of values"
                                                rows={10}
                                                style={{whiteSpace: 'nowrap'}}
                                                value={wizardModel.dataText}
                                            />
                                        </Formsy>
                                    </FormStep>
                                    <FormStep stepIndex={AssayUploadTabs.Grid} trackActive={false}>
                                        <EditableGridPanel
                                            model={gridModel}
                                            isSubmitting={wizardModel.isSubmitting}
                                            disabled={currentStep !== AssayUploadTabs.Grid}
                                            allowBulkRemove={allowBulkRemove}
                                            allowBulkUpdate={allowBulkInsert}
                                            bulkUpdateText={'Bulk Insert'}
                                            bulkUpdateProps={{
                                                title: 'Bulk Insert Assay Rows',
                                                header: 'Add a batch of assay data rows that will share the properties set below.'
                                            }}
                                            bordered={true}
                                            striped={true}
                                            addControlProps={{
                                                placement: 'bottom',
                                                nounPlural: "rows",
                                                nounSingular: "row"
                                            }}
                                        />
                                    </FormStep>
                                </div>
                            </div>
                            {showRenameModal && (this.renderFileRenameModal())}
                        </>
                    }
                </div>
            </div>
        );
    }
}