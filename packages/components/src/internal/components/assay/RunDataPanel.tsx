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
import React from 'react';
import Formsy from 'formsy-react';
import { Textarea } from 'formsy-react-components';
import { Map } from 'immutable';

import { Button } from 'react-bootstrap';

import { EditableGridPanel } from '../editable/EditableGridPanel';

import { handleTabKeyOnTextArea } from '../forms/actions';
import { FormStep, FormTabs } from '../forms/FormStep';

import { AssayUploadTabs, InferDomainResponse, QueryGridModel } from '../base/models/model';
import { getServerFilePreview } from '../base/actions';
import { getActionErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { FileAttachmentForm } from '../files/FileAttachmentForm';
import { Alert } from '../base/Alert';
import { FileSizeLimitProps } from '../files/models';
import { getEditorModel, helpLinkNode, IMPORT_DATA_FORM_TYPES } from '../../../index';
import { DATA_IMPORT_TOPIC } from '../../util/helpLinks';

import { getRunPropertiesFileName, getRunPropertiesRow } from './actions';
import { AssayWizardModel } from './models';

const TABS = ['Upload Files', 'Copy-and-Paste Data', 'Enter Data Into Grid'];
const PREVIEW_ROW_COUNT = 3;

interface Props {
    currentStep: number;
    wizardModel: AssayWizardModel;
    gridModel: QueryGridModel;
    onFileChange: (attachments: Map<string, File>) => any;
    onFileRemoval: (attachmentName: string) => any;
    onTextChange: (inputName: string, value: any) => any;
    acceptedPreviewFileFormats?: string;
    fullWidth?: boolean;
    allowBulkRemove?: boolean;
    allowBulkInsert?: boolean;
    allowBulkUpdate?: boolean;
    title: string;
    fileSizeLimits?: Map<string, FileSizeLimitProps>;
    maxInsertRows?: number;
    onGridDataChange?: (dirty: boolean, changeType: IMPORT_DATA_FORM_TYPES) => any;
}

interface PreviousRunData {
    isLoading?: boolean;
    isLoaded?: boolean;
    data?: InferDomainResponse;
    fileName?: string;
}

interface State {
    attachments?: Map<string, File>;
    message?: React.ReactNode;
    messageStyle?: string;
    previousRunData?: PreviousRunData;
}

export class RunDataPanel extends React.Component<Props, State> {
    static defaultProps = {
        fullWidth: true,
        allowBulkRemove: false,
        allowBulkInsert: false,
        allowBulkUpdate: false,
        title: 'Results',
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            previousRunData: props.wizardModel.usePreviousRunFile ? { isLoaded: false } : undefined,
        };
    }

    isRerun() {
        return this.props.wizardModel.runId !== undefined;
    }

    UNSAFE_componentWillMount(): void {
        this.initPreviewData();
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        if (nextProps.wizardModel.runId != this.props.wizardModel.runId) {
            this.setState(() => ({
                previousRunData: nextProps.wizardModel.usePreviousRunFile ? { isLoaded: false } : undefined,
            }));
        } else {
            this.initPreviewData();
        }
    }

    initPreviewData() {
        const { previousRunData } = this.state;
        const { wizardModel } = this.props;

        if (!this.isRerun() || !previousRunData || previousRunData.isLoaded || previousRunData.isLoading) {
            return;
        }

        if (wizardModel.isInit && wizardModel.usePreviousRunFile) {
            const row = getRunPropertiesRow(wizardModel.assayDef, wizardModel.runId);
            if (row.has('DataOutputs')) {
                const outputFiles = row.get('DataOutputs/DataFileUrl');
                if (outputFiles && outputFiles.size == 1) {
                    const outputs = row.get('DataOutputs');
                    this.setState(() => ({ previousRunData: { isLoading: true, isLoaded: false } }));

                    getServerFilePreview(outputs.getIn([0, 'value']), PREVIEW_ROW_COUNT)
                        .then(response => {
                            this.setState(() => ({
                                previousRunData: {
                                    isLoaded: true,
                                    data: response,
                                    fileName: getRunPropertiesFileName(row),
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
    }

    resetMessage = () => {
        this.setState(state => ({
            message: undefined,
        }));
    };

    onFileChange = (attachments: Map<string, File>) => {
        this.setState(
            () => ({
                message: undefined,
            }),
            () => {
                this.props.onFileChange(attachments);
            }
        );
    };

    onFileRemove = (attachmentName: string) => {
        this.setState(
            state => ({
                message: undefined,
                attachments: undefined,
                previousRunData: undefined,
            }),
            () => this.props.onFileRemoval(attachmentName)
        );
    };

    onTabChange = () => {
        this.resetMessage();
    };

    onRowCountChange = (rowCount: number) => {
        const { gridModel } = this.props;
        const editorModel = getEditorModel(gridModel.getId());
        if (this.props.onGridDataChange) {
            this.props.onGridDataChange(editorModel && editorModel.rowCount > 0, IMPORT_DATA_FORM_TYPES.GRID);
        }
    };

    render() {
        const {
            currentStep,
            gridModel,
            wizardModel,
            onTextChange,
            acceptedPreviewFileFormats,
            fullWidth,
            allowBulkRemove,
            allowBulkInsert,
            allowBulkUpdate,
            title,
            maxInsertRows,
        } = this.props;
        const { message, messageStyle, previousRunData } = this.state;
        const isLoading = !wizardModel.isInit || !gridModel || !gridModel.isLoaded;
        const isLoadingPreview = previousRunData && !previousRunData.isLoaded;

        let cutPastePlaceholder = 'Paste in a tab-separated set of values (including column headers).';
        if (maxInsertRows) {
            cutPastePlaceholder += '  Maximum number of data rows allowed is ' + maxInsertRows + '.';
        }
        return (
            <div className={'panel panel-default ' + (fullWidth ? 'full-width' : '')}>
                <div className="panel-heading">{title}</div>
                <div className="panel-body">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            <FormTabs tabs={TABS} onTabChange={this.onTabChange} />

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
                                        <Formsy>
                                            <Textarea
                                                changeDebounceInterval={0}
                                                cols={-1}
                                                elementWrapperClassName={[{ 'col-sm-9': false }, 'col-sm-12']}
                                                label=""
                                                labelClassName={[{ 'col-sm-3': false }, 'hidden']}
                                                name="rundata"
                                                onChange={(field, value) => onTextChange('text', value)}
                                                onKeyDown={handleTabKeyOnTextArea}
                                                placeholder={cutPastePlaceholder}
                                                rows={10}
                                                value={wizardModel.dataText}
                                            />
                                            <Button onClick={() => onTextChange('text', '')}>Clear</Button>
                                        </Formsy>
                                    </FormStep>
                                    <FormStep stepIndex={AssayUploadTabs.Grid} trackActive={false}>
                                        <EditableGridPanel
                                            model={gridModel}
                                            isSubmitting={wizardModel.isSubmitting}
                                            disabled={currentStep !== AssayUploadTabs.Grid}
                                            allowBulkRemove={allowBulkRemove}
                                            allowBulkAdd={allowBulkInsert}
                                            bulkAddText="Bulk Insert"
                                            bulkAddProps={{
                                                title: 'Bulk Insert Assay Rows',
                                                header:
                                                    'Add a batch of assay data rows that will share the properties set below.',
                                            }}
                                            allowBulkUpdate={allowBulkUpdate}
                                            bordered={true}
                                            striped={true}
                                            addControlProps={{
                                                placement: 'top',
                                                nounPlural: 'rows',
                                                nounSingular: 'row',
                                            }}
                                            initialEmptyRowCount={0}
                                            emptyGridMsg="Start by adding the quantity of assay data rows you want to create."
                                            maxTotalRows={this.props.maxInsertRows}
                                            onRowCountChange={this.onRowCountChange}
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
