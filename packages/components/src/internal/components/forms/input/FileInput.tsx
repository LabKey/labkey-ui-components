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
import React, { RefObject } from 'react';
import classNames from 'classnames';

import { FieldLabel } from '../FieldLabel';
import { cancelEvent } from '../../../events';

import { QueryColumn } from '../../base/models/model';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

interface FileInputState extends DisableableInputState {
    isHover: boolean;
    file?: File;
    error: string;
}

interface FileInputProps extends DisableableInputProps {
    changeDebounceInterval: number;
    elementWrapperClassName: string;
    labelClassName: string;
    showLabel: boolean;
    key: any;
    value?: any;
    name?: string;
    onChange: any;
    queryColumn?: QueryColumn;
    addLabelAsterisk?: boolean;
}

export class FileInput extends DisableableInput<FileInputProps, FileInputState> {
    fileInput: RefObject<HTMLInputElement>;

    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            changeDebounceInterval: 0,
            elementWrapperClassName: 'col-md-9 col-xs-12',
            labelClassName: 'control-label text-left',
            showLabel: true,
        },
    };

    constructor(props) {
        super(props);
        this.processFiles = this.processFiles.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.fileInput = React.createRef<HTMLInputElement>();
        this.state = {
            isHover: false,
            file: null,
            error: '',
            isDisabled: props.initiallyDisabled,
        };
    }

    getInputName(): string {
        // FIXME if there's more than one of these on the page with the same inputName
        // files will go to the wrong place when uploaded unless the names are unique
        return this.props.name ? this.props.name : this.props.queryColumn.name;
    }

    processFiles(fileList: FileList, transferItems?: DataTransferItemList) {
        const { onChange } = this.props;
        const name = this.getInputName();

        if (fileList.length > 1) {
            this.setState({ error: 'Only one file allowed' });
            return;
        }

        const file = fileList[0];

        if (transferItems && transferItems[0].webkitGetAsEntry().isDirectory) {
            this.setState({ error: 'Folders are not supported, only one file allowed' });
            return;
        }

        this.setState({ file, error: '' });
        onChange({ [name]: file });
    }

    onChange = (event: React.FormEvent<HTMLInputElement>) => {
        cancelEvent(event);
        this.processFiles(this.fileInput.current.files);
    };

    onDrag(event: React.DragEvent<HTMLElement>) {
        cancelEvent(event);

        if (!this.state.isHover) {
            this.setState({ isHover: true });
        }
    }

    onDragLeave(event: React.DragEvent<HTMLElement>) {
        cancelEvent(event);

        if (this.state.isHover) {
            this.setState({ isHover: false });
        }
    }

    onDrop(event: React.DragEvent<HTMLElement>) {
        cancelEvent(event);

        if (event.dataTransfer && event.dataTransfer.files) {
            this.processFiles(event.dataTransfer.files, event.dataTransfer.items);
            this.setState({ isHover: false });
        }
    }

    onRemove() {
        const { onChange } = this.props;
        const name = this.getInputName();

        this.setState({ file: null });
        onChange({ [name]: null });
    }

    render() {
        const { queryColumn, allowDisable, addLabelAsterisk, showLabel } = this.props;
        const { isHover, isDisabled, file } = this.state;

        const name = this.getInputName();
        const inputId = `${name}-fileUpload`;
        let body;

        if (file === null) {
            const labelClassName = classNames('file-upload--compact-label', { 'file-upload--is-hover': isHover });
            body = (
                <>
                    <input
                        disabled={this.state.isDisabled}
                        type="file"
                        className="file-upload--input" // This class makes the file input hidden
                        name={name}
                        id={inputId}
                        multiple={false}
                        onChange={this.onChange}
                        ref={this.fileInput}
                    />

                    {/* We render a label here so click and drag events propagate to the input above */}
                    <label
                        className={labelClassName}
                        htmlFor={inputId}
                        onDrop={this.onDrop}
                        onDragEnter={this.onDrag}
                        onDragOver={this.onDrag}
                        onDragLeave={this.onDragLeave}
                    >
                        <i className="fa fa-cloud-upload" aria-hidden="true" />
                        &nbsp;
                        <span>Select file or drag and drop here.</span>
                        <span className="file-upload--error-message">{this.state.error}</span>
                    </label>
                </>
            );
        } else {
            const attachedFileClass = classNames('attached-file--inline-container', {
                'file-upload--is-hover': isHover,
            });
            body = (
                <div
                    className={attachedFileClass}
                    onDrop={this.onDrop}
                    onDragEnter={this.onDrag}
                    onDragOver={this.onDrag}
                    onDragLeave={this.onDragLeave}
                >
                    <span className="fa fa-times-circle attached-file--remove-icon" onClick={this.onRemove} />
                    <span className="fa fa-file-text attached-file--icon" />
                    <span>{file.name}</span>
                    <span className="file-upload--error-message">{this.state.error}</span>
                </div>
            );
        }

        const labelOverlayProps = {
            isFormsy: false,
            inputId,
            addLabelAsterisk,
        };

        return (
            <div className="form-group row">
                <FieldLabel
                    labelOverlayProps={labelOverlayProps}
                    showLabel={showLabel}
                    showToggle={allowDisable}
                    column={queryColumn}
                    isDisabled={isDisabled}
                    toggleProps={{
                        onClick: this.toggleDisabled,
                    }}
                />
                <div className="col-md-9">{body}</div>
            </div>
        );
    }
}
