/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, RefObject, useMemo } from 'react';
import classNames from 'classnames';
import { Map } from 'immutable';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';
import { FieldLabel } from '../FieldLabel';
import { cancelEvent } from '../../../events';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';

import { FILELINK_RANGE_URI } from '../../domainproperties/constants';

import { fileMatchesAcceptedFormat } from '../../files/actions';

import { getTransferItemDirectoryEntry } from '../../files/FileAttachmentContainer';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { generateId } from '../../../util/utils';
import { LabelOverlayProps } from '../LabelOverlay';

type FileInputData = Map<string, any> | string | undefined;

export function initializeValue(initialValue: any): { data: FileInputData; formValue: string | undefined } {
    let data: Map<string, any> | string | undefined;
    let formValue: string;
    if (Map.isMap(initialValue)) {
        data = initialValue;
        formValue = initialValue.get('value');
    } else if (typeof initialValue === 'string') {
        const trimmedValue = initialValue.trim();
        if (trimmedValue !== '') {
            data = trimmedValue;
            formValue = trimmedValue;
        }
    }

    return { data, formValue };
}

export interface FileInputProps extends DisableableInputProps {
    acceptedFormats?: string;
    addLabelAsterisk?: boolean;
    changeDebounceInterval?: number;
    elementWrapperClassName?: string;
    emptyFileNotAllowed?: boolean;
    formsy?: boolean;
    initialValue?: any;
    labelClassName?: string;
    maxFileSize?: number;
    name?: string;
    onChange?: (fileMap: Record<string, File>) => void;
    queryColumn?: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    required?: boolean;
    showLabel?: boolean;
    toggleDisabledTooltip?: string;
}

type FileInputImplProps = FileInputProps & FormsyInjectedProps<any>;

interface State extends DisableableInputState {
    data: FileInputData;
    error: string;
    file: File;
    isHover: boolean;
}

class FileInputImpl extends DisableableInput<FileInputImplProps, State> {
    fileInput: RefObject<HTMLInputElement>;
    inputId: string;

    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            changeDebounceInterval: 0,
            elementWrapperClassName: INPUT_WRAPPER_CLASS_NAME,
            showLabel: true,
        },
    };

    constructor(props: FileInputImplProps) {
        super(props);
        this.toggleDisabled = this.toggleDisabled.bind(this);

        // Issue 53394: Distinct input ID so it does not collide with other elements on the page
        this.inputId = generateId('fileUpload-');
        this.fileInput = React.createRef<HTMLInputElement>();
        const { data, formValue } = initializeValue(props.initialValue);

        this.state = {
            data,
            file: null,
            error: '',
            isDisabled: props.initiallyDisabled,
            isHover: false,
        };

        if (!props.formsy && formValue) {
            props.setValue?.(formValue);
        }
    }

    getInputName(): string {
        return this.props.name ?? this.props.queryColumn.fieldKey;
    }

    processFiles = (fileList: FileList, transferItems?: DataTransferItemList): void => {
        const { acceptedFormats, maxFileSize, emptyFileNotAllowed } = this.props;
        if (fileList.length > 1) {
            this.setState({ error: 'Only one file allowed' });
            return;
        }

        if (getTransferItemDirectoryEntry(transferItems, 0)) {
            this.setState({ error: 'Folders are not supported, only one file allowed' });
            return;
        }

        const file = fileList[0];
        if (acceptedFormats) {
            const formatCheck = fileMatchesAcceptedFormat(file.name, acceptedFormats);
            if (!formatCheck.isMatch) {
                this.setState({ error: 'Invalid file type.' });
                return;
            }
        }

        if (maxFileSize && file.size > maxFileSize) {
            this.setState({
                error: `File size must not exceed ${Math.round(maxFileSize / 1024).toLocaleString()} KB.`,
            });
            return;
        }
        if (emptyFileNotAllowed && file.size === 0) {
            this.setState({ error: 'Empty file is not allowed.' });
            return;
        }
        this.setFormValue(file);
    };

    setFormValue = (file: File): void => {
        const { formsy, onChange, setValue } = this.props;
        this.setState({ data: undefined, file, error: '' });
        onChange?.({ [this.getInputName()]: file });

        if (formsy) {
            setValue?.(file);
        }
    };

    onChange = (event: React.FormEvent<HTMLInputElement>): void => {
        cancelEvent(event);
        this.processFiles(this.fileInput.current.files);
    };

    onDrag = (event: React.DragEvent<HTMLElement>): void => {
        cancelEvent(event);

        if (!this.state.isHover) {
            this.setState({ isHover: true });
        }
    };

    onDragLeave = (event: React.DragEvent<HTMLElement>): void => {
        cancelEvent(event);

        if (this.state.isHover) {
            this.setState({ isHover: false });
        }
    };

    onDrop = (event: React.DragEvent<HTMLElement>): void => {
        cancelEvent(event);

        if (event.dataTransfer && event.dataTransfer.files) {
            this.processFiles(event.dataTransfer.files, event.dataTransfer.items);
            this.setState({ isHover: false });
        }
    };

    onRemove = (): void => {
        // A value of null is supported by server APIs to clear/remove a file field's value.
        this.setFormValue(null);
    };

    render() {
        const {
            addLabelAsterisk,
            allowDisable,
            elementWrapperClassName,
            hasMixedValue,
            labelClassName,
            queryColumn,
            renderFieldLabel,
            required,
            showLabel,
            toggleDisabledTooltip,
        } = this.props;
        const { data, error, file, isDisabled, isHover } = this.state;
        const name = this.getInputName();

        let body: ReactNode;

        if (file || typeof data === 'string') {
            body = (
                <div
                    className={classNames('attached-file__inline-container text__wrap', {
                        'file-upload__is-hover': isHover,
                    })}
                    onDragEnter={this.onDrag}
                    onDragLeave={this.onDragLeave}
                    onDragOver={this.onDrag}
                    onDrop={this.onDrop}
                >
                    <span className="fa fa-times-circle attached-file__remove-icon" onClick={this.onRemove} />
                    <span className="fa fa-file-text attached-file--icon" />
                    <span>{file ? file.name : (data as string)}</span>
                    <div className="file-upload__error-message">{error}</div>
                </div>
            );
        } else if (Map.isMap(data) && data.get('value')) {
            body = (
                <FileColumnRenderer
                    data={data}
                    isFileLink={queryColumn?.rangeURI === FILELINK_RANGE_URI}
                    onRemove={isDisabled ? undefined : this.onRemove}
                />
            );
        } else {
            body = (
                <>
                    <input
                        className="file-upload__input" // This class makes the file input hidden
                        disabled={isDisabled}
                        id={this.inputId}
                        multiple={false}
                        name={name}
                        onChange={this.onChange}
                        ref={this.fileInput}
                        type="file"
                    />

                    {/* We render a label here, so click and drag events propagate to the input above */}
                    <label
                        className={classNames('file-upload--compact-label', {
                            'file-upload--is-disabled': isDisabled,
                            'file-upload__is-hover': isHover && !isDisabled,
                        })}
                        htmlFor={this.inputId}
                        onDragEnter={this.onDrag}
                        onDragLeave={this.onDragLeave}
                        onDragOver={this.onDrag}
                        onDrop={this.onDrop}
                    >
                        {isDisabled && hasMixedValue ? (
                            <span className="field__un-editable">{MIXED_VALUE_DISPLAY}</span>
                        ) : (
                            <>
                                <i aria-hidden="true" className="fa fa-cloud-upload" />
                                &nbsp;
                                <span>Select file or drag and drop here.</span>
                                <div className="file-upload__error-message">{error}</div>
                            </>
                        )}
                    </label>
                </>
            );
        }

        const labelOverlayProps: LabelOverlayProps = {
            addLabelAsterisk,
            dataKey: name,
            inputId: this.inputId,
            // While this component supports binding Formsy, it does not use a Formsy component
            // to render the associated label. As such, the label overlay is always configured as isFormsy={false}.
            isFormsy: false,
            labelClass: allowDisable ? undefined : labelClassName,
            required,
        };

        const hasCustomFieldLabel = !!renderFieldLabel;

        return (
            <div className="form-group row">
                {hasCustomFieldLabel && (
                    <span className={labelClassName} data-fieldkey={name}>
                        {renderFieldLabel(queryColumn)}
                        {required && <span className="required-symbol"> *</span>}
                    </span>
                )}
                {!hasCustomFieldLabel && (
                    <FieldLabel
                        column={queryColumn}
                        fieldName={name}
                        isDisabled={isDisabled}
                        labelOverlayProps={labelOverlayProps}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        toggleProps={{
                            onClick: toggleDisabledTooltip ? undefined : this.toggleDisabled,
                            toolTip: toggleDisabledTooltip,
                        }}
                    />
                )}
                <div className={elementWrapperClassName}>{body}</div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around FileInputImpl to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const FileInputFormsy = withFormsy<FileInputProps, any>(FileInputImpl);

export const FileInput: FC<FileInputProps> = props => {
    const { formsy = false, initialValue, queryColumn, required = queryColumn?.required ?? false } = props;

    // GitHub Issue 1387: The Formsy value for a file field is either the path of the currently attached file or the
    // File itself (once one has been selected). Seed the wrapper with the initial path so the field participates in
    // validation from the outset without being marked as dirty.
    const value = useMemo(() => {
        if (!formsy) return undefined;
        return initializeValue(initialValue).formValue;
    }, [formsy, initialValue]);

    if (formsy) {
        return <FileInputFormsy name={undefined} {...props} formsy required={required} value={value} />;
    }

    return <FileInputImpl {...(props as FileInputImplProps)} formsy={false} required={required} />;
};
FileInput.displayName = 'FileInput';
