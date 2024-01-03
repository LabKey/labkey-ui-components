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
import classNames from 'classnames';
import { Utils } from '@labkey/api';

import { Map, Set } from 'immutable';

import { FileSizeLimitProps } from '../../../public/files/models';

import { Alert } from '../base/Alert';

import { fileMatchesAcceptedFormat, fileSizeLimitCompare } from './actions';
import { FileAttachmentEntry } from './FileAttachmentEntry';
import { ALL_FILES_LIMIT_KEY } from './models';

interface FileAttachmentContainerProps {
    acceptedFormats?: string; // comma separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    // map between extension and SizeLimitProps.  Use "all" as the key for limits that apply to all formats.
    // "all" limits will be overridden by limits for a specific extension.
    sizeLimits?: Map<string, FileSizeLimitProps>;
    sizeLimitsHelpText?: React.ReactNode;
    allowMultiple: boolean;
    allowDirectories: boolean;
    handleChange?: any;
    handleRemoval?: any;
    index?: number;
    labelLong?: string;
    initialFileNames?: string[];
    initialFiles?: { [key: string]: File };
    compact?: boolean;
}

interface FileAttachmentContainerState {
    errorMsg?: React.ReactNode;
    files?: { [key: string]: File };
    isDirty?: boolean;
    fileNames?: string[]; // separate list of names for the case when an initial set of file names is provided for which we have no file object
    isHover?: boolean;
}

export class FileAttachmentContainer extends React.Component<
    FileAttachmentContainerProps,
    FileAttachmentContainerState
> {
    fileInput: React.RefObject<HTMLInputElement>;

    constructor(props?: FileAttachmentContainerProps) {
        super(props);

        this.fileInput = React.createRef();

        this.state = {
            files: props.initialFiles ? props.initialFiles : {},
            fileNames: props.initialFileNames || [],
            isDirty: false,
            isHover: false,
        };
    }

    UNSAFE_componentWillMount(): void {
        this.initFileNames(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: FileAttachmentContainerProps): void {
        if (this.props.initialFileNames != nextProps.initialFileNames && !this.state.isDirty) {
            this.initFileNames(nextProps);
        }
    }

    initFileNames(props: FileAttachmentContainerProps) {
        // since we do not have the file objects themselves, we do not check if the
        // file "type" is valid.  There is presumably nothing a user could do if it were
        // invalid.
        this.setState(() => ({
            fileNames: props.initialFileNames || (props.initialFiles && Object.keys(props.initialFiles)) || [],
        }));
    }

    validateFiles = (fileList: FileList, transferItems?: DataTransferItemList): Set<string> => {
        const { acceptedFormats, allowDirectories, sizeLimits } = this.props;

        this.setState({
            errorMsg: undefined,
            isHover: false,
        });

        if (!acceptedFormats && allowDirectories && !sizeLimits) {
            return Set<string>();
        }

        let invalidFileTypes = Map<string, string>(); // map from file name to extension
        let oversizedFiles = Map<string, string>(); // map from file name to display size limit
        const invalidDirectories = []; // list of directory names if not allowed;
        let invalidNames = Set<string>();

        Array.from(fileList).forEach((file, index) => {
            if (transferItems && transferItems[index].webkitGetAsEntry().isDirectory) {
                if (!allowDirectories) {
                    invalidDirectories.push(file.name);
                    invalidNames = invalidNames.add(file.name);
                }
            } else if (acceptedFormats) {
                const formatCheck = fileMatchesAcceptedFormat(file.name, acceptedFormats);
                if (!formatCheck.get('isMatch')) {
                    invalidFileTypes = invalidFileTypes.set(file.name, formatCheck.get('extension'));
                    invalidNames = invalidNames.add(file.name);
                }
            }
            if (sizeLimits) {
                if (!invalidFileTypes.has(file.name) && invalidDirectories.indexOf(file.name) < 0) {
                    const sizeCheck = fileSizeLimitCompare(file, sizeLimits);
                    if (sizeCheck.isOversized) {
                        oversizedFiles = oversizedFiles.set(file.name, sizeCheck.limits.maxSize.displayValue);
                        invalidNames = invalidNames.add(file.name);
                    }
                }
            }
        });
        if (!invalidNames.isEmpty()) {
            const errors = [];
            if (invalidDirectories.length > 0) {
                errors.push('Folders are not supported.');
            }
            if (!invalidFileTypes.isEmpty()) {
                let errorMsg = '';
                if (invalidFileTypes.size === 1) {
                    const fileName = invalidFileTypes.keySeq().first();
                    errorMsg += 'Invalid file type ' + invalidFileTypes.get(fileName) + '.';
                } else {
                    errorMsg +=
                        'Invalid file types: ' +
                        invalidFileTypes.map((extension, fileName) => extension).join(', ') +
                        '.';
                }
                errorMsg += '  Valid types are ' + acceptedFormats + '.  ';
                errors.push(errorMsg);
            }
            if (!oversizedFiles.isEmpty()) {
                if (oversizedFiles.size === 1) {
                    const fileName = oversizedFiles.keySeq().first();
                    errors.push(
                        <>
                            The file '{fileName}' is larger than the maximum allowed size of{' '}
                            {oversizedFiles.get(fileName)}. {this.props.sizeLimitsHelpText}
                        </>
                    );
                } else {
                    errors.push(
                        <>
                            These files are larger than their maximum allowed sizes:
                            <ul>
                                {oversizedFiles
                                    .map((limit, fileName) => {
                                        return (
                                            <li key={fileName}>
                                                {fileName} (max size: {limit})
                                            </li>
                                        );
                                    })
                                    .toArray()}
                            </ul>
                            {this.props.sizeLimitsHelpText}
                        </>
                    );
                }
            }
            this.setState({
                errorMsg:
                    invalidNames.size > 1 ? (
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    ) : (
                        errors
                    ),
                isHover: false,
            });
            return invalidNames;
        }

        return Set<string>();
    };

    handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.cancelEvent(evt);
        if (evt.currentTarget && evt.currentTarget.files) {
            this.handleFiles(evt.currentTarget.files);
        }
    };

    handleDrag = (evt: React.DragEvent<HTMLLabelElement>) => {
        const { isHover } = this.state;

        this.cancelEvent(evt);
        if (!isHover) {
            this.setState({ isHover: true });
        }
    };

    handleDrop = (evt: React.DragEvent<HTMLLabelElement>) => {
        this.cancelEvent(evt);
        if (evt.dataTransfer && evt.dataTransfer.files) {
            this.handleFiles(evt.dataTransfer.files, evt.dataTransfer.items);
        }
    };

    handleFiles(fileList: FileList, transferItems?: DataTransferItemList) {
        const { allowMultiple, handleChange } = this.props;

        if (!allowMultiple && fileList.length > 1) {
            this.setState({
                errorMsg: 'Only one file allowed.',
                isHover: false,
            });
            return;
        }

        const invalidFiles = this.validateFiles(fileList, transferItems);

        let haveValidFiles = false;
        // iterate through the file list and set the names as the object key
        const newFiles: any = Object.keys(fileList).reduce((prev, next) => {
            const file = fileList[next];
            if (!invalidFiles.contains(file.name)) {
                prev[file.name] = file;
                haveValidFiles = true;
            }
            return prev;
        }, {});

        if (haveValidFiles) {
            const files = Object.assign({}, newFiles, this.state.files);
            this.setState({
                files,
                fileNames: Object.keys(files),
                isHover: false,
                isDirty: true,
            });

            if (Utils.isFunction(handleChange)) {
                handleChange(files);
            }
        }
    }

    handleLeave = (evt: React.DragEvent<HTMLLabelElement>) => {
        const { isHover } = this.state;

        this.cancelEvent(evt);

        if (isHover) {
            this.setState({ isHover: false });
        }
    };

    handleRemove = (name: string) => {
        const { handleRemoval } = this.props;

        const fileNames = this.state.fileNames.filter(fileName => name !== fileName);

        const files = {};
        for (const filename of Object.keys(this.state.files)) {
            if (fileNames.indexOf(filename) >= 0) files[filename] = this.state.files[filename];
        }

        // NOTE: This will clear the field entirely so multiple file support
        // will need to account for this and rewrite this clearing mechanism
        if (this.fileInput.current) {
            this.fileInput.current.value = '';
        }

        this.setState({ isDirty: true, errorMsg: undefined, files, fileNames });

        if (Utils.isFunction(handleRemoval)) {
            handleRemoval(name);
        }
    };

    renderErrorDetails() {
        const { errorMsg } = this.state;

        if (errorMsg !== '' && errorMsg !== undefined) {
            return (
                <Alert className={this.props.compact ? 'file-upload--error-message--compact' : null}>{errorMsg}</Alert>
            );
        }
    }

    cancelEvent(event: React.SyntheticEvent<any>): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    getLabelLong() {
        const { labelLong, sizeLimits } = this.props;

        if (!sizeLimits || !sizeLimits.has(ALL_FILES_LIMIT_KEY) || sizeLimits.size > 1) {
            return labelLong;
        }
        const allMaxSize = sizeLimits.get(ALL_FILES_LIMIT_KEY).maxSize;
        return allMaxSize
            ? labelLong +
                  ' The maximum file size allowed is ' +
                  sizeLimits.get(ALL_FILES_LIMIT_KEY).maxSize.displayValue +
                  '.'
            : labelLong;
    }

    render() {
        const { acceptedFormats, allowMultiple, index, compact } = this.props;
        const { fileNames, isHover } = this.state;
        const hideFileUpload = !allowMultiple && fileNames.length > 0;
        const fileUploadText = 'fileUpload' + (index !== undefined ? index : '');

        return (
            <>
                <div
                    className={classNames('file-upload--container', hideFileUpload ? 'hidden' : 'block', {
                        'file-upload--container--compact': compact,
                    })}
                >
                    <label
                        className={classNames({
                            'file-upload--label': !compact,
                            'file-upload--label--compact': compact,
                            'file-upload__is-hover': isHover,
                        })}
                        htmlFor={fileUploadText}
                        onDragEnter={this.handleDrag}
                        onDragLeave={this.handleLeave}
                        onDragOver={this.handleDrag}
                        onDrop={this.handleDrop}
                    >
                        <i
                            className={classNames('fa fa-cloud-upload', {
                                'fa-2x cloud-logo': !compact,
                                'file-upload__label__icon': compact,
                            })}
                            aria-hidden="true"
                        />
                        {this.getLabelLong()}
                    </label>
                    <input
                        accept={acceptedFormats}
                        className="file-upload--input"
                        id={fileUploadText}
                        multiple={allowMultiple}
                        name={fileUploadText}
                        onChange={this.handleChange}
                        ref={this.fileInput}
                        type="file"
                    />
                </div>

                {this.renderErrorDetails()}

                {fileNames.map((fileName: string) => {
                    return <FileAttachmentEntry key={fileName} name={fileName} onDelete={this.handleRemove} />;
                })}
            </>
        );
    }
}
