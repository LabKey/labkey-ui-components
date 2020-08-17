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
import { Button } from 'react-bootstrap';
import { List, Map } from 'immutable';
import classNames from 'classnames';

import { FormSection } from '../base/FormSection';
import { Progress } from '../base/Progress';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { InferDomainResponse } from '../base/models/model';

import { inferDomainFromFile } from '../base/actions';

import { FileAttachmentContainer } from './FileAttachmentContainer';
import { FileGridPreviewProps, FilePreviewGrid } from './FilePreviewGrid';
import { convertRowDataIntoPreviewData, fileMatchesAcceptedFormat, fileSizeLimitCompare } from './actions';

import { FileSizeLimitProps } from './models';

interface FileAttachmentFormProps {
    acceptedFormats?: string; // comma-separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    // map between extension and SizeLimitProps.  Use "all" as the key for limits that apply to all formats.
    // "all" limits will be overridden by limits for a specific extension.
    sizeLimits?: Map<string, FileSizeLimitProps>;
    sizeLimitsHelpText?: React.ReactNode;
    showAcceptedFormats?: boolean;
    allowDirectories?: boolean;
    allowMultiple?: boolean;
    cancelText?: string;
    initialFileNames?: string[];
    initialFiles?: { [key: string]: File };
    index?: number;
    label?: string;
    labelLong?: string;
    onCancel?: () => any;
    onFileChange?: (files: Map<string, File>) => any;
    onFileRemoval?: (attachmentName: string) => any;
    onSubmit?: (files: Map<string, File>) => any;
    isSubmitting?: boolean;
    showButtons?: boolean;
    showLabel?: boolean;
    showProgressBar?: boolean;
    submitText?: string;
    previewGridProps?: FileGridPreviewProps;
    templateUrl?: string;
    compact?: boolean;
    ref?: any;
}

interface State {
    attachedFiles: Map<string, File>;
    errorMessage?: string;
    previewData?: List<Map<string, any>>;
    previewStatus?: string;
}

export class FileAttachmentForm extends React.Component<FileAttachmentFormProps, State> {
    static defaultProps = {
        acceptedFormats: '',
        showAcceptedFormats: true,
        allowDirectories: true,
        allowMultiple: true,
        cancelText: 'Cancel',
        label: 'Attachments',
        labelLong: 'Select file or drag and drop here.',
        onCancel: undefined,
        onSubmit: undefined,
        showButtons: false,
        showLabel: true,
        showProgressBar: false,
        submitText: 'Upload',
        compact: false,
    };

    fileAttachmentContainerRef: React.RefObject<FileAttachmentContainer>;

    constructor(props?: FileAttachmentFormProps) {
        super(props);

        this.fileAttachmentContainerRef = React.createRef();

        if (props.allowMultiple && props.previewGridProps) {
            console.warn('Showing the file preview grid is only supported for single file upload.');
        }

        this.state = {
            attachedFiles: Map<string, File>(),
            errorMessage: undefined,
            previewStatus: undefined,
        };
    }

    UNSAFE_componentWillMount(): void {
        this.initPreviewData(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: FileAttachmentFormProps): void {
        if (this.props.previewGridProps !== nextProps.previewGridProps) {
            this.initPreviewData(nextProps);
        }
    }

    initPreviewData(props: FileAttachmentFormProps) {
        let previewData;
        if (props.previewGridProps && props.previewGridProps.initialData) {
            previewData = convertRowDataIntoPreviewData(
                props.previewGridProps.initialData.get('data'),
                props.previewGridProps.previewCount
            );
            this.setState(() => ({ previewData }));
        }
    }

    determineFileSize(): number {
        const { attachedFiles } = this.state;

        return attachedFiles.reduce((total, file) => (total += file.size), 0);
    }

    handleFileChange = (fileList: { [key: string]: File }) => {
        const { onFileChange, sizeLimits } = this.props;
        const attachedFiles = this.state.attachedFiles.merge(fileList);

        this.setState(
            () => ({ attachedFiles }),
            () => {
                if (this.isShowPreviewGrid()) {
                    // if showing preview, there can be only one attached file
                    const sizeCheck = fileSizeLimitCompare(attachedFiles.valueSeq().first(), sizeLimits);
                    if (!sizeCheck.isOversizedForPreview) this.uploadDataFileForPreview();
                    else {
                        this.setState(() => ({
                            errorMessage:
                                'This file is too large to be previewed. The maximum size allowed for previewing files of this type is ' +
                                sizeCheck.limits.maxPreviewSize.displayValue,
                        }));
                    }
                }

                if (onFileChange) {
                    onFileChange(attachedFiles);
                }
            }
        );
    };

    handleFileRemoval = (attachmentName: string) => {
        const { onFileRemoval } = this.props;

        this.setState(
            () => ({
                attachedFiles: this.state.attachedFiles.remove(attachmentName),
                previewData: undefined,
                previewStatus: undefined,
                errorMessage: undefined,
            }),
            () => {
                if (onFileRemoval) {
                    onFileRemoval(attachmentName);
                }
            }
        );
    };

    manuallyClearFiles = (attachmentName: string) => {
        this.fileAttachmentContainerRef.current.handleRemove(attachmentName);
    }

    handleSubmit = () => {
        const { onSubmit } = this.props;

        if (onSubmit) onSubmit(this.state.attachedFiles);
        // clear out attached files once they have been submitted.
        this.setState(() => ({
            attachedFiles: Map<string, File>(),
        }));
    };

    renderButtons() {
        const { cancelText, onCancel, submitText, compact } = this.props;

        const button =
            <Button
                className={classNames('file-form-submit-btn', {'file-form-submit-btn--compact': compact})}
                onClick={this.handleSubmit}
                bsStyle="success"
                disabled={this.state.attachedFiles.size == 0}
                title={submitText}
            >
                {submitText}
            </Button>;


        if (compact) {
            return (button)
        } else {
            return (
                <div className="row top-spacing bottom-spacing">
                    <div className="col-xs-6">
                        <Button onClick={onCancel} bsStyle="default" title={cancelText}>
                            {cancelText}
                        </Button>
                    </div>
                    <div className="col-xs-6">
                        <div className="pull-right">
                            {button}
                        </div>
                    </div>
                </div>
            );
        }
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
            return <FilePreviewGrid {...previewGridProps} data={previewData} errorMsg={errorMessage} />;
        } else if (previewStatus) {
            return (
                <div className="margin-top">
                    <LoadingSpinner msg={previewStatus} />
                </div>
            );
        }
    }

    updatePreviewStatus(previewStatus: string) {
        this.setState(() => ({ previewStatus }));
    }

    updateErrors(errorMessage: string) {
        this.setState(() => ({ errorMessage }));
    }

    uploadDataFileForPreview() {
        const { previewGridProps } = this.props;
        const { attachedFiles } = this.state;

        // just take the first file, since we only support 1 file at this time
        const file = attachedFiles.first();

        // check if this usage has a set of formats which are supported for preview
        if (previewGridProps.acceptedFormats) {
            const fileCheck = fileMatchesAcceptedFormat(file.name, previewGridProps.acceptedFormats);
            // if the file extension doesn't match the accepted preview formats, return without trying to get preview data
            if (!fileCheck.get('isMatch')) {
                return;
            }
        }

        this.updatePreviewStatus('Uploading file...');

        inferDomainFromFile(file, previewGridProps.previewCount)
            .then((response: InferDomainResponse) => {
                this.updatePreviewStatus(null);

                if (!previewGridProps.skipPreviewGrid) {
                    if (response.data.size > 1) {
                        const previewData = convertRowDataIntoPreviewData(
                            response.data,
                            previewGridProps.previewCount,
                            response.fields
                        );
                        this.setState(() => ({ previewData }));
                        this.updateErrors(null);
                    } else {
                        this.updateErrors('No data found in the attached file.');
                    }
                }

                if (previewGridProps.onPreviewLoad) {
                    previewGridProps.onPreviewLoad(response, file);
                }
            })
            .catch(reason => {
                this.updateErrors(
                    'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            });
    }

    shouldRenderAcceptedFormats(): boolean {
        const { acceptedFormats, showAcceptedFormats } = this.props;
        return acceptedFormats && showAcceptedFormats && !this.shouldShowPreviewGrid();
    }

    renderAcceptedFormats() {
        return (
            <div className="file-form-formats">
                <strong>Supported formats include: </strong>
                {this.props.acceptedFormats}
            </div>
        );
    }

    shouldRenderTemplateButton(): boolean {
        const { templateUrl } = this.props;
        return templateUrl && templateUrl.length > 0 && !this.shouldShowPreviewGrid();
    }

    renderTemplateButton() {
        return (
            <Button bsStyle="info" title="Download Template" href={this.props.templateUrl}>
                <span className="fa fa-download" /> Template
            </Button>
        );
    }

    renderFooter() {
        if (!this.shouldRenderAcceptedFormats() && !this.shouldRenderTemplateButton()) {
            return;
        }

        return (
            <div className="row">
                <div className="col-md-9">{this.shouldRenderAcceptedFormats() && this.renderAcceptedFormats()}</div>
                <div className="col-md-3">
                    <div className="pull-right">{this.shouldRenderTemplateButton() && this.renderTemplateButton()}</div>
                </div>
            </div>
        );
    }

    render() {
        const {
            acceptedFormats,
            allowDirectories,
            allowMultiple,
            initialFileNames,
            initialFiles,
            label,
            labelLong,
            showButtons,
            showLabel,
            showProgressBar,
            sizeLimits,
            sizeLimitsHelpText,
            isSubmitting,
            compact,
        } = this.props;

        return (
            <>
                <span className="translator--toggle__wizard">
                    <FormSection iconSpacer={false} label={label} showLabel={showLabel}>
                        <div className={classNames({'file-upload--one-row': compact})}>
                            <FileAttachmentContainer
                                ref={this.fileAttachmentContainerRef}
                                index={this.props.index}
                                acceptedFormats={acceptedFormats}
                                allowDirectories={allowDirectories}
                                handleChange={this.handleFileChange}
                                handleRemoval={this.handleFileRemoval}
                                initialFileNames={initialFileNames}
                                initialFiles={initialFiles}
                                allowMultiple={allowMultiple}
                                sizeLimits={sizeLimits}
                                sizeLimitsHelpText={sizeLimitsHelpText}
                                labelLong={labelLong}
                                compact={compact}
                            />
                                {compact && showButtons && this.renderButtons()}
                        </div>
                    </FormSection>
                </span>
                {this.renderPreviewGrid()}
                {showProgressBar && (
                    <Progress
                        estimate={this.determineFileSize() * 0.1}
                        modal={true}
                        title="Uploading"
                        toggle={isSubmitting}
                    />
                )}
                {this.renderFooter()}
                {!compact && showButtons && this.renderButtons()}
            </>
        );
    }
}
