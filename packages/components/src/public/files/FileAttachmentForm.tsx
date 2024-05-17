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
import React, { ReactNode } from 'react';
import { List, Map } from 'immutable';
import classNames from 'classnames';

import { FileAttachmentContainer } from '../../internal/components/files/FileAttachmentContainer';
import {
    convertRowDataIntoPreviewData,
    fileMatchesAcceptedFormat,
    fileSizeLimitCompare,
    getFileExtension,
} from '../../internal/components/files/actions';
import { FilePreviewGrid } from '../../internal/components/files/FilePreviewGrid';
import { SimpleResponse } from '../../internal/components/files/models';

import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { InferDomainResponse } from '../InferDomainResponse';
import { inferDomainFromFile } from '../../internal/components/assay/utils';
import { FormSection } from '../../internal/components/base/FormSection';
import { Progress } from '../../internal/components/base/Progress';

import { TemplateDownloadButton } from './TemplateDownloadButton';
import { FileSizeLimitProps, FileGridPreviewProps } from './models';

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
    initialFiles?: Record<string, File>;
    index?: number;
    label?: string;
    labelLong?: string;
    onCancel?: () => void;
    onError?: (error: string) => void;
    onFileChange?: (files: Map<string, File>) => void;
    onFileRemoval?: (attachmentName: string, updatedFiles?: Map<string, File>) => void;
    // map between file extension and the callback function to use instead of the standard uploadDataFileForPreview
    fileSpecificCallback?: Map<string, (file: File) => Promise<SimpleResponse>>;
    onSubmit?: (files: Map<string, File>) => void;
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
        fileSpecificCallback: undefined,
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

    componentDidMount(): void {
        this.initPreviewData();
    }

    componentDidUpdate(prevProps: FileAttachmentFormProps): void {
        if (prevProps.previewGridProps !== this.props.previewGridProps) {
            this.initPreviewData();
        }
    }

    initPreviewData(): void {
        const { previewGridProps } = this.props;

        if (previewGridProps?.initialData) {
            this.setState({
                previewData: convertRowDataIntoPreviewData(
                    previewGridProps.initialData.get('data'),
                    previewGridProps.previewCount
                ),
            });
        }
    }

    determineFileSize(): number {
        const { attachedFiles } = this.state;

        return attachedFiles.reduce((total, file) => (total += file.size), 0);
    }

    reportFileOversized = (attachedFiles: Map<string, File>, sizeStr: string): void => {
        this.setState(() => ({
            errorMessage:
                'This file is too large to be previewed. The maximum size allowed for previewing files of this type is ' +
                sizeStr,
        }));
    };

    handleFileChange = (fileList: Record<string, File>): void => {
        const { onFileChange, sizeLimits, fileSpecificCallback, allowMultiple } = this.props;
        const attachedFiles = this.state.attachedFiles.merge(fileList);

        this.setState(
            () => ({ attachedFiles }),
            () => {
                if (!allowMultiple) {
                    // currently only supporting 1 file for processing contents
                    const firstFile = attachedFiles.valueSeq().first();
                    const sizeCheck = fileSizeLimitCompare(firstFile, sizeLimits);

                    const fileTypeFn = fileSpecificCallback?.get(getFileExtension(firstFile.name));
                    if (fileTypeFn) {
                        if (!sizeCheck.isOversized) {
                            fileTypeFn(firstFile)
                                .then(res => {
                                    this.updateErrors(res.success ? null : res.msg);
                                })
                                .catch(res => {
                                    this.updateErrors(res.msg);
                                });
                        } else {
                            this.reportFileOversized(attachedFiles, sizeCheck.limits.maxSize.displayValue);
                        }
                    } else if (this.isShowPreviewGrid()) {
                        if (!sizeCheck.isOversizedForPreview) {
                            this.uploadDataFileForPreview();
                        } else {
                            this.reportFileOversized(attachedFiles, sizeCheck.limits.maxPreviewSize.displayValue);
                        }
                    }
                }

                onFileChange?.(attachedFiles);
            }
        );
    };

    handleFileRemoval = (attachmentName: string): void => {
        const { onFileRemoval } = this.props;

        this.setState(
            state => ({
                attachedFiles: state.attachedFiles.remove(attachmentName),
                previewData: undefined,
                previewStatus: undefined,
                errorMessage: undefined,
            }),
            () => {
                onFileRemoval?.(attachmentName, this.state.attachedFiles);
            }
        );
    };

    manuallyClearFiles = (attachmentName: string): void => {
        this.fileAttachmentContainerRef.current.handleRemove(attachmentName);
    };

    handleSubmit = (): void => {
        this.props.onSubmit?.(this.state.attachedFiles);

        // clear out attached files once they have been submitted.
        this.setState({ attachedFiles: Map<string, File>() });
    };

    renderButtons(): ReactNode {
        const { cancelText, onCancel, submitText, compact } = this.props;

        const button = (
            <button
                className={classNames('file-form-submit-btn btn btn-success', {
                    'file-form-submit-btn--compact': compact,
                })}
                disabled={this.state.attachedFiles.size === 0}
                onClick={this.handleSubmit}
                title={submitText}
                type="button"
            >
                {submitText}
            </button>
        );

        if (compact) {
            return button;
        }

        return (
            <div className="row top-spacing bottom-spacing">
                <div className="col-xs-6">
                    <button className="btn btn-default" onClick={onCancel} title={cancelText} type="button">
                        {cancelText}
                    </button>
                </div>
                <div className="col-xs-6">
                    <div className="pull-right">{button}</div>
                </div>
            </div>
        );
    }

    isShowPreviewGrid() {
        return !this.props.allowMultiple && this.props.previewGridProps;
    }

    shouldShowPreviewGrid() {
        const { errorMessage, previewData, previewStatus } = this.state;
        return errorMessage || previewStatus || previewData;
    }

    renderPreviewGrid(): ReactNode {
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

    updatePreviewStatus(previewStatus: string): void {
        this.setState(() => ({ previewStatus }));
    }

    updateErrors(errorMessage: string): void {
        if (errorMessage) {
            this.props.onError?.(errorMessage);
        }
        this.setState(() => ({ errorMessage }));
    }

    uploadDataFileForPreview(): void {
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

        inferDomainFromFile(file, previewGridProps.previewCount, previewGridProps.domainKindName)
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
                    reason
                        ? reason?.exception || reason
                        : 'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            });
    }

    shouldRenderAcceptedFormats(): boolean {
        const { acceptedFormats, showAcceptedFormats } = this.props;
        return acceptedFormats && showAcceptedFormats && !this.shouldShowPreviewGrid();
    }

    renderAcceptedFormats(): ReactNode {
        return (
            <div className="file-form-formats">
                <strong>Supported formats include: </strong>
                {this.props.acceptedFormats}
            </div>
        );
    }

    shouldRenderTemplateButton(): boolean {
        const { templateUrl } = this.props;
        return templateUrl?.length > 0 && !this.shouldShowPreviewGrid();
    }

    renderFooter(): ReactNode {
        if (!this.shouldRenderAcceptedFormats() && !this.shouldRenderTemplateButton()) {
            return;
        }

        return (
            <div className="row">
                <div className="col-md-9">{this.shouldRenderAcceptedFormats() && this.renderAcceptedFormats()}</div>
                <div className="col-md-3">
                    <div className="pull-right">
                        {this.shouldRenderTemplateButton() && (
                            <TemplateDownloadButton templateUrl={this.props.templateUrl} />
                        )}
                    </div>
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
                        <div className={classNames({ 'file-upload--one-row': compact })}>
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
