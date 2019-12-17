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

import { fileMatchesAcceptedFormat } from './actions';

interface FileAttachmentContainerProps {
    acceptedFormats?: string // comma separated list of allowed extensions i.e. '.png, .jpg, .jpeg'
    allowMultiple: boolean
    allowDirectories: boolean
    handleChange?: any
    handleRemoval?: any
    labelLong?: string
    initialFileNames?: Array<string>
    initialFiles?: {[key:string]: File}
}

interface FileAttachmentContainerState {
    errorMsg?: string
    files?: {[key:string]: File}
    fileNames?: Array<string> // separate list of names for the case when an initial set of file names is provided for which we have no file object
    isHover?: boolean
}

export class FileAttachmentContainer extends React.Component<FileAttachmentContainerProps, FileAttachmentContainerState> {

    fileInput: React.RefObject<HTMLInputElement>;

    constructor(props?: FileAttachmentContainerProps) {
        super(props);

        this.areValidFileTypes = this.areValidFileTypes.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleLeave = this.handleLeave.bind(this);

        this.fileInput = React.createRef();

        this.state = {
            files: props.initialFiles ? props.initialFiles : {},
            fileNames: props.initialFileNames || [],
            isHover: false
        }
    }

    componentWillMount() {
        this.initFileNames(this.props);
    }

    componentWillReceiveProps(nextProps: FileAttachmentContainerProps) {
        if (this.props.initialFileNames != nextProps.initialFileNames && Object.keys(this.state.files).length === 0) {
            this.initFileNames(nextProps);
        }
    }

    initFileNames(props: FileAttachmentContainerProps) {
        // since we do not have the file objects themselves, we do not check if the
        // file "type" is valid.  There is presumably nothing a user could do if it were
        // invalid.
        this.setState(() => ({fileNames: props.initialFileNames || (props.initialFiles && Object.keys(props.initialFiles)) || []}))
    }


    areValidFileTypes(fileList: FileList, transferItems?: DataTransferItemList) {
        const { acceptedFormats, allowDirectories } = this.props;

        if (!acceptedFormats && allowDirectories) {
            return true;
        }

        let isValid: boolean = true;

        Array.from(fileList).forEach((file, index) => {
            if (transferItems && transferItems[index].webkitGetAsEntry().isDirectory) {
                if (!allowDirectories) {
                    isValid = false;
                    this.setState({
                        errorMsg: 'Folders not yet supported.',
                        isHover: false
                    });
                    return false;
                }
            }
            else if (acceptedFormats) {
                const formatCheck = fileMatchesAcceptedFormat(file.name, acceptedFormats);
                if (!formatCheck.get('isMatch')) {
                    isValid = false;
                    this.setState({
                        errorMsg: 'Invalid file type: ' + formatCheck.get('extension') + '. Valid types are ' + acceptedFormats,
                        isHover: false
                    });
                    return false;
                }
            }
        });
        return isValid;
    }

    handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
        this.cancelEvent(evt);
        if (evt.currentTarget && evt.currentTarget.files) {
            this.handleFiles(evt.currentTarget.files);
        }
    }

    handleDrag(evt: React.DragEvent<HTMLLabelElement>) {
        const { isHover } = this.state;

        this.cancelEvent(evt);
        if (!isHover) {
            this.setState({isHover: true});
        }
    }

    handleDrop(evt: React.DragEvent<HTMLLabelElement>) {
        this.cancelEvent(evt);
        if (evt.dataTransfer && evt.dataTransfer.files) {
            this.handleFiles(evt.dataTransfer.files, evt.dataTransfer.items);
        }
    }

    handleFiles(fileList: FileList, transferItems?: DataTransferItemList) {
        const { allowMultiple, handleChange } = this.props;

        if (!allowMultiple && fileList.length > 1) {
            this.setState({
                errorMsg: 'Only one file allowed.',
                isHover: false
            });
            return;
        }

        let isValid = this.areValidFileTypes(fileList, transferItems);

        let files = this.state.files;

        if (isValid) {
            // iterate through the file list and set the names as the object key
            let newFiles = Object.keys(fileList).reduce((prev, next) => {
                const file = fileList[next];
                prev[file.name] = file;
                return prev;
            }, {});

            files = Object.assign({}, newFiles, this.state.files);
            this.setState({
                files,
                fileNames: Object.keys(files),
                errorMsg: undefined,
                isHover: false
            });

            if (Utils.isFunction(handleChange)) {
                handleChange(files);
            }
        }
    }

    handleLeave(evt: React.DragEvent<HTMLLabelElement>) {
        const { isHover } = this.state;

        this.cancelEvent(evt);

        if (isHover) {
            this.setState({isHover: false});
        }
    }

    handleRemove(name: string) {
        const { handleRemoval } = this.props;

        const fileNames = this.state.fileNames.filter((fileName) =>  (name !== fileName));

        let files = {};
        for (let filename of Object.keys(this.state.files)) {
            if (fileNames.indexOf(filename) >=0)
                files[filename] = this.state.files[filename];
        }

        // NOTE: This will clear the field entirely so multiple file support
        // will need to account for this and rewrite this clearing mechanism
        if (this.fileInput.current) {
            this.fileInput.current.value = '';
        }

        this.setState({files, fileNames});

        if (Utils.isFunction(handleRemoval)) {
            handleRemoval(name);
        }
    }

    renderErrorDetails() {
        const { errorMsg } = this.state;

        if (errorMsg !== '' && errorMsg !== undefined) {
            return (
                <div className="has-error">
                    <span className="error-message help-block">{errorMsg}</span>
                </div>
            )
        }
    }

    cancelEvent(event: React.SyntheticEvent<any>): void {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    render() {
        const { acceptedFormats, allowMultiple, labelLong } = this.props;
        const { fileNames, isHover } = this.state;
        const hideFileUpload = !allowMultiple && fileNames.length > 0;

        return (
            <div>
                <div className={classNames("file-upload--container", (hideFileUpload ? "hidden" : "block"))}>
                    <label
                        className={classNames("file-upload--label", {'file-upload__is-hover': isHover})}
                        htmlFor="fileUpload"
                        onDragEnter={this.handleDrag}
                        onDragLeave={this.handleLeave}
                        onDragOver={this.handleDrag}
                        onDrop={this.handleDrop}>
                        <i className="fa fa-cloud-upload fa-2x cloud-logo" aria-hidden="true"/>
                        {labelLong}
                    </label>
                    <input
                        accept={acceptedFormats}
                        className="file-upload--input"
                        id="fileUpload"
                        multiple={allowMultiple}
                        name="fileUpload"
                        onChange={this.handleChange}
                        ref={this.fileInput}
                        type="file"/>
                </div>

                {this.renderErrorDetails()}

                {fileNames.map((fileName: string) => {
                    return (
                        <div key={fileName} className="attached-file--container">
                            <span
                                className="fa fa-times-circle file-upload__remove--icon"
                                onClick={() => this.handleRemove(fileName)}
                                title={"Remove file"}/>
                            <span className="fa fa-file-text" style={{
                                color: 'darkgray',
                                fontSize: '20px',
                                marginRight: '7px',
                                marginBottom: '10px'}}/>
                            {fileName}
                        </div>
                    )
                })}
            </div>
        )
    }
}
