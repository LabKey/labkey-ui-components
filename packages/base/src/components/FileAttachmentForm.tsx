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
import { Map } from 'immutable'

import { FormSection } from './FormSection'
import { Progress } from './Progress'
import { FileAttachmentContainer } from './FileAttachmentContainer'

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
}

interface State {
    attachedFiles: Map<string, File>
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

        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleFileRemoval = this.handleFileRemoval.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            attachedFiles: Map<string, File>()
        };
    }

    determineFileSize(): number {
        const { attachedFiles } = this.state;

        return attachedFiles.reduce((total, file) =>( total += file.size), 0);
    }

    handleFileChange(fileList: {[key: string]: File}) {
        const { onFileChange } = this.props;

        this.setState({
            attachedFiles: this.state.attachedFiles.merge(fileList)
        }, () => {
            if (onFileChange) {
                onFileChange(this.state.attachedFiles)
            }
        });
    }

    handleFileRemoval(attachmentName: string) {
        const { onFileRemoval } = this.props;

        this.setState({
            attachedFiles: this.state.attachedFiles.remove(attachmentName)
        }, () => {
            if (onFileRemoval) {
                onFileRemoval(attachmentName);
            }
        });
    }

    handleSubmit() {
        const { onSubmit } = this.props;

        if (onSubmit)
            onSubmit(this.state.attachedFiles);
        // clear out attached files once they have been submitted.
        this.setState({
            attachedFiles: Map<string, File>()
        });
    }

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
                {showProgressBar && (
                    <Progress
                        estimate={this.determineFileSize() * .1}
                        modal={true}
                        title="Uploading"
                        toggle={isSubmitting}/>
                )}
                {acceptedFormats && showAcceptedFormats && (
                    <div className={"file-form-formats"}>
                        <strong>Supported formats include: </strong>{acceptedFormats}
                    </div>
                )}
                {showButtons && this.renderButtons()}
            </>
        )
    }
}