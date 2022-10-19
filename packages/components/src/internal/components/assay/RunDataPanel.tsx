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
import React, { PureComponent, ReactNode } from 'react';
import Formsy from 'formsy-react';
import { Textarea } from 'formsy-react-components';
import { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';

import { AssayUploadTabs } from '../../constants';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { EditorModel, EditorModelProps } from '../../models';

import { DATA_IMPORT_TOPIC, helpLinkNode } from '../../util/helpLinks';
import { EditableGridPanel } from '../editable/EditableGridPanel';

import { FileSizeLimitProps } from '../../../public/files/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { getActionErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { FormStep, FormTabs } from '../forms/FormStep';
import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';
import { handleTabKeyOnTextArea } from '../forms/actions';
import { Alert } from '../base/Alert';

import { getRunPropertiesFileName } from './actions';
import { AssayWizardModel } from './AssayWizardModel';
import { getServerFilePreview } from './utils';
import { Query } from '@labkey/api';

const TABS = ['Upload Files', 'Copy-and-Paste Data', 'Enter Data Into Grid'];
const PREVIEW_ROW_COUNT = 3;

interface Props {
    acceptedPreviewFileFormats?: string;
    allowBulkInsert?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    currentStep: number;
    editorModel: EditorModel;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    getIsDirty?: () => boolean;
    maxEditableGridRowMsg?: string;
    maxRows?: number;
    onFileChange: (attachments: Map<string, File>) => any;
    onFileRemoval: (attachmentName: string) => any;
    onGridChange: (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<any, Map<string, any>>
    ) => void;
    onTextChange: (value: any) => any;
    queryModel: QueryModel;
    runPropertiesRow?: Record<string, any>;
    setIsDirty?: (isDirty: boolean) => void;
    wizardModel: AssayWizardModel;
    title: string;
    showTabs?: boolean;
}

interface PreviousRunData {
    data?: InferDomainResponse;
    fileName?: string;
    isLoaded?: boolean;
    isLoading?: boolean;
}

interface State {
    message?: ReactNode;
    messageStyle?: string;
    previousRunData?: PreviousRunData;
}

export class RunDataPanel extends PureComponent<Props, State> {
    static defaultProps = {
        allowBulkRemove: false,
        allowBulkInsert: false,
        allowBulkUpdate: false,
        title: 'Results',
        showTabs: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            previousRunData: props.wizardModel.usePreviousRunFile ? { isLoaded: false } : undefined,
        };
    }

    componentDidMount(): void {
        this.initPreviewData();
    }

    componentDidUpdate(prevProps: Props): void {
        const { wizardModel } = this.props;

        if (prevProps.wizardModel.runId !== wizardModel.runId) {
            this.setState(() => ({
                previousRunData: wizardModel.usePreviousRunFile ? { isLoaded: false } : undefined,
            }));
        } else {
            this.initPreviewData();
        }
    }

    isRerun = (): boolean => {
        return this.props.wizardModel.runId !== undefined;
    };

    initPreviewData = (): void => {
        const { previousRunData } = this.state;
        const { wizardModel, runPropertiesRow } = this.props;

        if (!this.isRerun() || !previousRunData || previousRunData.isLoaded || previousRunData.isLoading) {
            return;
        }

        if (wizardModel.isInit && wizardModel.usePreviousRunFile) {
            if (runPropertiesRow && runPropertiesRow['DataOutputs']) {
                const outputFiles = runPropertiesRow['DataOutputs/DataFileUrl'];
                if (outputFiles?.length === 1) {
                    const outputs = runPropertiesRow['DataOutputs'];
                    this.setState(() => ({ previousRunData: { isLoading: true, isLoaded: false } }));

                    getServerFilePreview(outputs[0].value, PREVIEW_ROW_COUNT)
                        .then(response => {
                            this.setState(() => ({
                                previousRunData: {
                                    isLoaded: true,
                                    data: response,
                                    fileName: getRunPropertiesFileName(runPropertiesRow),
                                },
                            }));
                        })
                        .catch(reason => {
                            this.setState(() => ({
                                message: getActionErrorMessage(
                                    "There was a problem retrieving the current run's data for previewing. ",
                                    'assay run'
                                ),
                                messageStyle: 'danger',
                                previousRunData: {
                                    isLoaded: true,
                                },
                            }));
                        });
                } else {
                    let message = 'No preview data available for the current run.';
                    if (outputFiles.size > 1) {
                        message +=
                            '  There are ' +
                            outputFiles.size +
                            ' output files for this run. Preview is not currently supported for multiple files.';
                    }
                    this.setState(() => ({
                        message,
                        messageStyle: 'info',
                        previousRunData: {
                            isLoaded: true,
                        },
                    }));
                }
            }
        }
    };

    resetMessage = (): void => {
        this.setState(() => ({ message: undefined }));
    };

    onFileChange = (attachments: Map<string, File>): void => {
        this.setState(
            () => ({ message: undefined }),
            () => this.props.onFileChange(attachments)
        );
    };

    onFileRemove = (attachmentName: string): void => {
        this.setState(
            () => ({ message: undefined, previousRunData: undefined }),
            () => this.props.onFileRemoval(attachmentName)
        );
    };

    onTabChange = (): void => {
        this.resetMessage();
    };

    onTextChange = (fieldName: string, value: string): void => {
        this.props.onTextChange(value);
    };

    clearText = (): void => {
        this.props.onTextChange('');
    };

    render() {
        const {
            acceptedPreviewFileFormats,
            allowBulkInsert,
            allowBulkRemove,
            allowBulkUpdate,
            currentStep,
            editorModel,
            maxEditableGridRowMsg,
            maxRows,
            queryModel,
            title,
            showTabs,
            wizardModel,
            getIsDirty,
            setIsDirty,
        } = this.props;
        const { message, messageStyle, previousRunData } = this.state;
        const isLoading = !wizardModel.isInit || queryModel.isLoading;
        const isLoadingPreview = previousRunData && !previousRunData.isLoaded;

        let cutPastePlaceholder = 'Paste in a tab-separated set of values (including column headers).';
        if (maxRows) {
            cutPastePlaceholder += '  Maximum number of data rows allowed is ' + maxRows + '.';
        }
        return (
            <div className="panel panel-default">
                <div className="panel-heading">{title}</div>
                <div className="panel-body">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {showTabs && <FormTabs tabs={TABS} onTabChange={this.onTabChange} />}

                            <div className="row">
                                <div className="col-sm-12">
                                    <FormStep stepIndex={AssayUploadTabs.Files}>
                                        {isLoadingPreview ? (
                                            <LoadingSpinner />
                                        ) : (
                                            <FileAttachmentForm
                                                allowDirectories={false}
                                                allowMultiple={false}
                                                showLabel={false}
                                                initialFileNames={
                                                    previousRunData && previousRunData.fileName
                                                        ? [previousRunData.fileName]
                                                        : []
                                                }
                                                onFileChange={this.onFileChange}
                                                onFileRemoval={this.onFileRemove}
                                                templateUrl={wizardModel.assayDef.templateLink}
                                                previewGridProps={
                                                    acceptedPreviewFileFormats && {
                                                        previewCount: PREVIEW_ROW_COUNT,
                                                        acceptedFormats: acceptedPreviewFileFormats,
                                                        initialData: previousRunData ? previousRunData.data : undefined,
                                                    }
                                                }
                                                sizeLimits={this.props.fileSizeLimits}
                                                sizeLimitsHelpText={
                                                    <>
                                                        We recommend dividing your data into smaller files that meet
                                                        this limit. See our{' '}
                                                        {helpLinkNode(DATA_IMPORT_TOPIC, 'help document')} for best
                                                        practices on data import.
                                                    </>
                                                }
                                            />
                                        )}
                                    </FormStep>
                                    <FormStep stepIndex={AssayUploadTabs.Copy}>
                                        {/* TODO: Seems to be a highly unnecessary usage of Formsy */}
                                        <Formsy>
                                            <Textarea
                                                changeDebounceInterval={0}
                                                cols={-1}
                                                elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                                                label=""
                                                labelClassName={[{ 'col-sm-3': false }, 'hidden']}
                                                name="rundata"
                                                onChange={this.onTextChange}
                                                onKeyDown={handleTabKeyOnTextArea}
                                                placeholder={cutPastePlaceholder}
                                                rows={10}
                                                value={wizardModel.dataText}
                                            />
                                            <Button onClick={this.clearText}>Clear</Button>
                                        </Formsy>
                                    </FormStep>
                                    <FormStep stepIndex={AssayUploadTabs.Grid} trackActive={false}>
                                        <EditableGridPanel
                                            addControlProps={{
                                                placement: 'top',
                                                nounPlural: 'rows',
                                                nounSingular: 'row',
                                                invalidCountMsg: maxEditableGridRowMsg,
                                            }}
                                            allowBulkAdd={allowBulkInsert}
                                            allowBulkRemove={allowBulkRemove}
                                            allowBulkUpdate={allowBulkUpdate}
                                            bordered
                                            bulkAddText="Bulk Insert"
                                            bulkAddProps={{
                                                title: 'Bulk Insert Assay Rows',
                                                header: 'Add a batch of assay data rows that will share the properties set below.',
                                            }}
                                            containerFilter={Query.containerFilter.currentPlusProjectAndShared}
                                            disabled={currentStep !== AssayUploadTabs.Grid}
                                            editorModel={editorModel}
                                            emptyGridMsg="Start by adding the quantity of assay data rows you want to create."
                                            isSubmitting={wizardModel.isSubmitting}
                                            maxRows={this.props.maxRows}
                                            model={queryModel}
                                            onChange={this.props.onGridChange}
                                            striped
                                            getIsDirty={getIsDirty}
                                            setIsDirty={setIsDirty}
                                        />
                                    </FormStep>
                                </div>
                            </div>
                            <div className="top-spacing">
                                <Alert bsStyle={messageStyle}>{message}</Alert>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
}
