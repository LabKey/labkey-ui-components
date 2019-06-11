/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
            previewData: undefined,
            previewStatus: undefined
        };
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
        const file = attachedFiles.first();

        // check if this usage has a set of formats which are supported for preview
        if (previewGridProps.acceptedFormats) {
            const fileCheck = fileMatchesAcceptedFormat(file, previewGridProps.acceptedFormats);
            // if the file extension doesn't match the accepted preview formats, return without trying to get preview data
            if (!fileCheck.get('isMatch')) {
                return;
            }
        }

        this.updatePreviewStatus("Uploading file...");

        //just take the first file, since we only support 1 file at this time
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

    render() {
        const {
            acceptedFormats,
            showAcceptedFormats,
            allowDirectories,
            allowMultiple,
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
                {acceptedFormats && showAcceptedFormats && !this.shouldShowPreviewGrid() && (
                    <div className={"file-form-formats"}>
                        <strong>Supported formats include: </strong>{acceptedFormats}
                    </div>
                )}
                {showButtons && this.renderButtons()}
            </>
        )
    }
}