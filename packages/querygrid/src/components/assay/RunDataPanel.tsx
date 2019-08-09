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
import { getRunPropertiesRow } from './actions';

const TABS = ['Upload Files', 'Copy-and-Paste Data', 'Enter Data Into Grid'];

interface Props {
    currentStep: number
    wizardModel: AssayWizardModel
    gridModel: QueryGridModel
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
    message?: React.ReactNode
    messageStyle?: string
    previousRunData: PreviousRunData
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
            previousRunData : {
                isLoaded: false,
                isLoading: false
            }
        }
    }

    isRerun() {
        return this.props.wizardModel.runId !== undefined;
    }

    componentWillMount() {
        this.initPreviewData();
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.wizardModel.runId != this.props.wizardModel.runId) {
            this.setState(() => ({
                previousRunData: {
                    isLoaded: false,
                    isLoading: false
                }
            }));
        } else {
            this.initPreviewData();
        }
    }

    initPreviewData() {
        if (!this.isRerun() || this.state.previousRunData.isLoaded || this.state.previousRunData.isLoading) {
           return;
        }

        this.setState(() => ({previousRunData: {isLoading: true}}));

        const { gridModel, wizardModel } = this.props;

        if (wizardModel.isInit  && gridModel && gridModel.isLoaded  && wizardModel.usePreviousRunFile) {
            const row = getRunPropertiesRow(this.props.wizardModel.assayDef, this.props.wizardModel.runId);
            if (row.has("DataOutputs")) {
                const outputFiles = row.get('DataOutputs/DataFileUrl');
                if (outputFiles && outputFiles.size > 0) {
                    const outputs = row.get('DataOutputs');
                    if (outputs.size > 1) {
                        console.warn("More than one data output for this run.  Using the last.");
                    }

                    getServerFilePreview(outputs.getIn([outputs.size - 1, "value"]), RunDataPanel.previewCount).then((response) => {
                        this.setState(() => ({
                                previousRunData: {
                                    isLoaded: true,
                                    isLoading: false,
                                    data: response,
                                    fileName: outputs.getIn([outputs.size - 1, 'displayValue'])
                                }
                            }
                        ));
                    }).catch((reason) => {
                        this.setState(() => ({
                            message: getActionErrorMessage("There was a problem retrieving the current run's data for previewing. ", "assay run"),
                            messageStyle: "danger",
                            previousRunData: {
                                isLoaded: true,
                                isLoading: false
                            }
                        }));
                    });
                }
                else {
                    this.setState(() => ({
                        message: "No preview data available for the current run.",
                        messageStyle: "info"
                    }))
                }
            }
        }
    }

    resetState = () => {
        this.setState( (state) => ({
            message: undefined,
            attachments: undefined,
            previousRunData: {...state.previousRunData, ...{
                isLoaded: false,
                isLoading: false
            }}
        }));
    };

    onFileChange = (attachments: Map<string, File>) => {
        this.setState(() => ({
            message: undefined
        }), () => this.props.onFileChange(attachments));
    };

    onFileRemove = (attachmentName: string) => {
        this.setState( (state) => ({
            message: undefined,
            attachments: undefined,
            previousRunData: {
                isLoaded: false,
                isLoading: false
            }
        }), () => this.props.onFileRemoval(attachmentName));
    };

    onTabChange = () => {
        this.resetState();
    };

    render() {
        const { currentStep, gridModel, wizardModel, onTextChange, acceptedPreviewFileFormats, fullWidth, allowBulkRemove, allowBulkInsert } = this.props;
        const { message, messageStyle } = this.state;
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

                            <div className="row">
                                <div className="col-sm-12">
                                    <FormStep stepIndex={AssayUploadTabs.Files}>
                                        <FileAttachmentForm
                                            allowDirectories={false}
                                            allowMultiple={false}
                                            showLabel={false}
                                            initialFileNames={wizardModel.usePreviousRunFile && this.state.previousRunData && this.state.previousRunData.fileName ? [this.state.previousRunData.fileName] : []}
                                            onFileChange={this.onFileChange}
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
                            <div className={"top-spacing"}>
                                <Alert bsStyle={messageStyle}>
                                    {message}
                                </Alert>
                            </div>
                        </>
                    }
                </div>
            </div>
        );
    }
}