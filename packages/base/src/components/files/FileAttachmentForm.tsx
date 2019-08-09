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
import { Button } from 'react-bootstrap'
import { Map, List } from 'immutable'

import { FormSection } from '../FormSection'
import { Progress } from '../Progress'
import { FileAttachmentContainer } from './FileAttachmentContainer'
import { FileGridPreviewProps, FilePreviewGrid } from "./FilePreviewGrid";
import { LoadingSpinner } from "../LoadingSpinner";
import { convertRowDataIntoPreviewData, fileMatchesAcceptedFormat } from "./actions";
import { InferDomainResponse } from "../../models/model";
import { inferDomainFromFile } from "../../action/actions";

interface FileAttachmentFormProps {
    acceptedFormats?: string // comma-separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    showAcceptedFormats?: boolean
    allowDirectories?: boolean
    allowMultiple?: boolean
    cancelText?: string
    initialFileNames?: Array<string>
    label?: string
    labelLong?: string
    onCancel?: () => any
    onFileChange?: (files: Map<string, File>) => any
    onFileRemoval?: (attachmentName: string) => any
    onSubmit?: (files: Map<string, File>) => any
    isSubmitting?: boolean
    showButtons?: boolean
    showLabel?: boolean
    showProgressBar?: boolean
    submitText?: string
    previewGridProps?: FileGridPreviewProps
    templateUrl?: string
}

interface State {
    attachedFiles: Map<string, File>
    errorMessage?: string
    previewData?: List<Map<string, any>>
    previewStatus?: string
}

export class FileAttachmentForm extends React.Component<FileAttachmentFormProps, State> {

    static defaultProps = {
        acceptedFormats: '',
        showAcceptedFormats: true,
        allowDirectories: true,
        allowMultiple: true,
        cancelText: 'Cancel',
        label: 'Attachments',
        labelLong: 'Select file or drag and drop here',
        onCancel: undefined,
        onSubmit: undefined,
        showButtons: false,
        showLabel: true,
        showProgressBar: false,
        submitText: 'Upload'
    };

    constructor(props?: FileAttachmentFormProps) {
        super(props);

        if (props.allowMultiple && props.previewGridProps) {
            console.warn('Showing the file preview grid is only supported for single file upload.')
        }

        this.state = {
            attachedFiles: Map<string, File>(),
            errorMessage: undefined,
            previewStatus: undefined
        };
    }

    componentWillMount() {
        this.initPreviewData(this.props)
    }

    componentWillReceiveProps(nextProps: FileAttachmentFormProps) {
        if (this.props.previewGridProps !== nextProps.previewGridProps) {
            this.initPreviewData(nextProps);
        }
    }

    initPreviewData(props: FileAttachmentFormProps) {
        let previewData;
        if (props.previewGridProps && props.previewGridProps.initialData) {
            previewData = convertRowDataIntoPreviewData(props.previewGridProps.initialData.get('data'), props.previewGridProps.previewCount);
            this.setState(() => ({previewData}));
        }
    }

    determineFileSize(): number {
        const { attachedFiles } = this.state;

        return attachedFiles.reduce((total, file) =>( total += file.size), 0);
    }

    handleFileChange = (fileList: {[key: string]: File}) => {
        const { onFileChange } = this.props;
        const attachedFiles = this.state.attachedFiles.merge(fileList);

        this.setState(() => ({attachedFiles}), () => {

            if (this.isShowPreviewGrid()) {
                this.uploadDataFileForPreview();
            }

            if (onFileChange) {
                onFileChange(attachedFiles)
            }
        });
    };

    handleFileRemoval = (attachmentName: string) => {
        const { onFileRemoval } = this.props;

        this.setState({
            attachedFiles: this.state.attachedFiles.remove(attachmentName),
            previewData: undefined,
            previewStatus: undefined,
            errorMessage: undefined
        }, () => {
            if (onFileRemoval) {
                onFileRemoval(attachmentName);
            }
        });
    };

    handleSubmit = () => {
        const { onSubmit } = this.props;

        if (onSubmit)
            onSubmit(this.state.attachedFiles);
        // clear out attached files once they have been submitted.
        this.setState({
            attachedFiles: Map<string, File>()
        });
    };

    renderButtons() {
        const { cancelText, onCancel, submitText } = this.props;

        return (
            <div className="row top-spacing bottom-spacing">
                <div className="col-md-7">
                    <Button
                        onClick={onCancel}
                        bsStyle="default"
                        title={cancelText}>
                        {cancelText}
                    </Button>
                </div>
                <div className="col-md-5">
                    <div className="pull-right">
                        <Button
                            className={"file-form-submit-btn"}
                            onClick={this.handleSubmit}
                            bsStyle="success"
                            disabled={this.state.attachedFiles.size == 0}
                            title={submitText}>
                            {submitText}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    isShowPreviewGrid() {
        return !this.props.allowMultiple && this.props.previewGridProps;
    }

    shouldShowPreviewGrid() {
        const { errorMessage, previewData, previewStatus } = this.state;
        return errorMessage || previewStatus || previewData;
    }

    renderPreviewGrid() {
        const { previewGridProps } = this.props;
        const { errorMessage, previewData, previewStatus } = this.state;

        if (!this.shouldShowPreviewGrid()) {
            return;
        }

        if (previewData || errorMessage) {
            return (
                <FilePreviewGrid
                    {...previewGridProps}
                    data={previewData}
                    errorMsg={errorMessage}
                />
            )
        }
        else if (previewStatus) {
            return (
                <div className={"margin-top"}>
                    <LoadingSpinner msg={previewStatus}/>
                </div>
            )
        }
    }

    updatePreviewStatus(previewStatus: string) {
        this.setState(() => ({previewStatus}));
    }

    updateErrors(errorMessage: string) {
        this.setState(() => ({errorMessage}));
    }

    uploadDataFileForPreview() {
        const { previewGridProps } = this.props;
        const { attachedFiles } = this.state;

        //just take the first file, since we only support 1 file at this time
        const file = attachedFiles.first();

        // check if this usage has a set of formats which are supported for preview
        if (previewGridProps.acceptedFormats) {
            const fileCheck = fileMatchesAcceptedFormat(file.name, previewGridProps.acceptedFormats);
            // if the file extension doesn't match the accepted preview formats, return without trying to get preview data
            if (!fileCheck.get('isMatch')) {
                return;
            }
        }

        this.updatePreviewStatus("Uploading file...");

        inferDomainFromFile(file, previewGridProps.previewCount)
            .then((response: InferDomainResponse) => {
                this.updatePreviewStatus(null);

                if (response.data.size > 1) {
                    const previewData = convertRowDataIntoPreviewData(response.data, previewGridProps.previewCount);
                    this.setState(() => ({previewData}));
                    this.updateErrors(null);
                }
                else {
                    this.updateErrors('No data found in the attached file.');
                }

                if (previewGridProps.onPreviewLoad) {
                    previewGridProps.onPreviewLoad(response);
                }
            })
            .catch((reason) => {
                this.updateErrors(reason);
            })
    }

    shouldRenderAcceptedFormats(): boolean {
        const { acceptedFormats, showAcceptedFormats } = this.props;
        return acceptedFormats && showAcceptedFormats && !this.shouldShowPreviewGrid();
    }

    renderAcceptedFormats() {
        return (
            <div className={"file-form-formats"}>
                <strong>Supported formats include: </strong>{this.props.acceptedFormats}
            </div>
        )
    }

    shouldRenderTemplateButton(): boolean {
        const { templateUrl } = this.props;
        return templateUrl && templateUrl.length > 0 && !this.shouldShowPreviewGrid();
    }

    renderTemplateButton() {

        return (
            <Button
                bsStyle={'info'}
                title={'Download Template'}
                href={this.props.templateUrl}
            >
                <span className="fa fa-download"/> Template
            </Button>
        )
    }

    renderFooter() {
        if (!this.shouldRenderAcceptedFormats() && !this.shouldRenderTemplateButton()) {
            return;
        }

        return (
            <div className="row">
                <div className="col-md-9">
                    {this.shouldRenderAcceptedFormats() && this.renderAcceptedFormats()}
                </div>
                <div className="col-md-3">
                    <div className={'pull-right'}>
                        {this.shouldRenderTemplateButton() && this.renderTemplateButton()}
                    </div>
                </div>
            </div>
        )
    }

    render() {
        const {
            acceptedFormats,
            allowDirectories,
            allowMultiple,
            initialFileNames,
            label,
            labelLong,
            showButtons,
            showLabel,
            showProgressBar,
            isSubmitting
        } = this.props;

        return (
            <>
                <span className="translator--toggle__wizard">
                    <FormSection
                        iconSpacer={false}
                        label={label}
                        showLabel={showLabel}>
                        <FileAttachmentContainer
                            acceptedFormats={acceptedFormats}
                            allowDirectories={allowDirectories}
                            handleChange={this.handleFileChange}
                            handleRemoval={this.handleFileRemoval}
                            initialFileNames={initialFileNames}
                            allowMultiple={allowMultiple}
                            labelLong={labelLong}/>
                    </FormSection>
                </span>
                {this.renderPreviewGrid()}
                {showProgressBar && (
                    <Progress
                        estimate={this.determineFileSize() * .1}
                        modal={true}
                        title="Uploading"
                        toggle={isSubmitting}/>
                )}
                {this.renderFooter()}
                {showButtons && this.renderButtons()}
            </>
        )
    }
}