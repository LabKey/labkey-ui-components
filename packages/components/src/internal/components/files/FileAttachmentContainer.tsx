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
    includeDirectoryFiles?: boolean;
    fileCountSuffix?: string;
    handleChange?: any;
    handleRemoval?: any;
    index?: number;
    labelLong?: string;
    initialFileNames?: string[];
    initialFiles?: Record<string, File>;
    compact?: boolean;
}

interface FileAttachmentContainerState {
    errorMsg?: React.ReactNode;
    warningMsg?: React.ReactNode;
    files?: Record<string, File>;
    isDirty?: boolean;
    fileNames?: string[]; // separate list of names for the case when an initial set of file names is provided for which we have no file object
    isHover?: boolean;
}

export class FileAttachmentContainer extends React.Component<
    FileAttachmentContainerProps,
    FileAttachmentContainerState
> {
    fileInput: React.RefObject<HTMLInputElement>;

    dirCbCount: number;
    fileCbCount: number;

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

    componentDidMount(): void {
        this.initFileNames();
    }

    componentDidUpdate(prevProps: FileAttachmentContainerProps): void {
        if (!this.state.isDirty && this.props.initialFileNames !== prevProps.initialFileNames) {
            this.initFileNames();
        }
    }

    initFileNames = (): void => {
        const { initialFileNames, initialFiles } = this.props;

        // since we do not have the file objects themselves, we do not check if the
        // file "type" is valid.  There is presumably nothing a user could do if it were
        // invalid.
        this.setState({
            fileNames: initialFileNames || (initialFiles && Object.keys(initialFiles)) || [],
        });
    };

    getFilesFromDirectory = (files, entry, scope, callback): void => {
        const dirReader = entry.createReader();
        const entriesReader = ((scope) => {
            return (entries) => {
                for (let i = 0; i < entries.length; i++) {
                    const _entry = entries[i];
                    if (_entry.isFile) {
                        scope.fileCbCount++;
                        _entry.file(file => {
                            scope.fileCbCount--;

                            // ignore hidden files
                            if (file.name.substring(0, 1) !== '.') {
                                if (files[file.name]) {
                                    scope.setState({ warningMsg: 'Duplicate files were uploaded. Only the last file provided for the duplicate name will be included in the file set.' });
                                }
                                file.fullPath = entry.fullPath + '/' + file.name;
                                files[file.name] = file;
                            }

                            if (scope.dirCbCount === 0 && scope.fileCbCount === 0) {
                                callback();
                            }
                        });
                    } else if (_entry.isDirectory) {
                        scope.getFilesFromDirectory(files, _entry, scope, callback);
                    }
                }

                // readEntries only reads 100 files in a batch for Chrome
                if (entries.length >= 100) {
                    scope.dirCbCount++;
                    dirReader.readEntries(entriesReader, console.error);
                }

                scope.dirCbCount--;
                if (scope.dirCbCount === 0 && scope.fileCbCount === 0) {
                    callback();
                }
            };
        })(scope);

        scope.dirCbCount++;
        dirReader.readEntries(entriesReader, console.error);
    };

    validateFiles = (fileList: FileList, transferItems?: DataTransferItemList): Set<string> => {
        const { acceptedFormats, allowDirectories, sizeLimits } = this.props;

        this.setState({ errorMsg: undefined, warningMsg: undefined, isHover: false });

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
                                    .map((limit, fileName) => (
                                        // eslint-disable-next-line react/no-array-index-key
                                        <li key={fileName}>
                                            {fileName} (max size: {limit})
                                        </li>
                                    ))
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
        const { allowMultiple, allowDirectories, includeDirectoryFiles } = this.props;

        if (!allowMultiple && fileList.length > 1) {
            this.setState({
                errorMsg: 'Only one file allowed.',
                isHover: false,
            });
            return;
        }

        const invalidFiles = this.validateFiles(fileList, transferItems);

        // iterate through the file list and set the names as the object key
        const newFiles = {};
        let haveValidFiles = false;
        let hasDirectory = false;
        Array.from(fileList).forEach((file, index) => {
            if (!invalidFiles.contains(file.name)) {
                if (this.state.files?.[file.name]) {
                    this.setState({ warningMsg: 'Duplicate files were uploaded. Only the last file will be included in the file set.' });
                }

                newFiles[file.name] = file;
                haveValidFiles = true;

                if (transferItems && transferItems[index].webkitGetAsEntry().isDirectory) {
                    hasDirectory = true;
                }
            }
        });

        if (haveValidFiles) {
            const files = Object.assign({}, newFiles, this.state.files);

            if (hasDirectory && allowDirectories && includeDirectoryFiles) {
                this.dirCbCount = 0;
                this.fileCbCount = 0;
                Array.from(fileList).forEach((file, index) => {
                    const entry = transferItems[index].webkitGetAsEntry();
                    if (entry.isDirectory) {
                        delete files[file.name];
                        this.getFilesFromDirectory(files, entry, this, () => {
                            this._handleFiles(files);
                        });
                    }
                });
            } else {
                this._handleFiles(files);
            }
        }
    }

    _handleFiles = (files: Record<string, File>): void => {
        const { handleChange, sizeLimits } = this.props;

        const totalSizeLimit = sizeLimits.get(ALL_FILES_LIMIT_KEY)?.totalSize;
        if (totalSizeLimit) {
            const totalFileSize = Object.values(files).reduce((total, file) => {
                return total + file.size;
            }, 0);

            if (totalFileSize > totalSizeLimit.value) {
                this.setState({
                    errorMsg: `The total file size of all files exceeds the maximum allowed size of ${totalSizeLimit.displayValue}.`,
                    isHover: false,
                });
                return;
            }
        }

        this.setState({
            files,
            fileNames: Object.keys(files),
            isHover: false,
            isDirty: true,
        });

        if (Utils.isFunction(handleChange)) {
            handleChange(files);
        }
    };

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

        this.setState({ isDirty: true, errorMsg: undefined, warningMsg: undefined, files, fileNames });

        if (Utils.isFunction(handleRemoval)) {
            handleRemoval(name);
        }
    };

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
        const { acceptedFormats, allowMultiple, index, compact, fileCountSuffix } = this.props;
        const { fileNames, isHover, errorMsg, warningMsg } = this.state;
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

                {(warningMsg !== '' && warningMsg !== undefined) && (
                    <Alert bsStyle="warning" className={this.props.compact ? 'file-upload--error-message--compact' : null}>{warningMsg}</Alert>
                )}
                {(errorMsg !== '' && errorMsg !== undefined) && (
                    <Alert className={this.props.compact ? 'file-upload--error-message--compact' : null}>{errorMsg}</Alert>
                )}

                <div className={classNames('file-upload--file-entry-listing', {'well well-sm': allowMultiple && fileNames.length})}>
                    {fileNames.map((fileName: string) => {
                        return <FileAttachmentEntry key={fileName} name={fileName} onDelete={this.handleRemove} />;
                    })}
                </div>
                {fileCountSuffix && fileNames.length > 0 && (
                    <div className="file-upload--scroll-footer">
                        {Utils.pluralBasic(fileNames.length, 'file')} {fileCountSuffix}.
                    </div>
                )}
            </>
        );
    }
}
