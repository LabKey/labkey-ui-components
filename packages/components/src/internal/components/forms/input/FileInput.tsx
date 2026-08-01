/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {
    DragEventHandler,
    FC,
    FormEventHandler,
    ReactNode,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import classNames from 'classnames';
import { Map } from 'immutable';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';
import { FieldLabel, ToggleProps } from '../FieldLabel';
import { cancelEvent } from '../../../events';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';

import { FILELINK_RANGE_URI } from '../../domainproperties/constants';

import { fileMatchesAcceptedFormat } from '../../files/actions';

import { getTransferItemDirectoryEntry } from '../../files/FileAttachmentContainer';

import { DisableableInputProps, useDisableableInput } from './DisableableInput';
import { generateId } from '../../../util/utils';
import { LabelOverlayProps } from '../LabelOverlay';

type FileInputData = Map<string, any> | string | undefined;
type FileInputValue = File | null | string | undefined;

export function initializeValue(initialValue: any): { data: FileInputData; value: string | undefined } {
    let data: Map<string, any> | string | undefined;
    let value: string;

    if (Map.isMap(initialValue)) {
        data = initialValue;
        value = initialValue.get('value');
    } else if (typeof initialValue === 'string') {
        const trimmedValue = initialValue.trim();
        if (trimmedValue !== '') {
            data = trimmedValue;
            value = trimmedValue;
        }
    }

    return { data, value };
}

export interface FileInputProps extends DisableableInputProps<FileInputValue> {
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

interface FileInputImplOwnProps {
    initialData: FileInputData;
}

type FileInputImplProps = FileInputImplOwnProps & FileInputProps & FormsyInjectedProps<FileInputValue>;

const FileInputImpl: FC<FileInputImplProps> = props => {
    const {
        acceptedFormats,
        addLabelAsterisk,
        allowDisable = false,
        initialData,
        elementWrapperClassName = INPUT_WRAPPER_CLASS_NAME,
        emptyFileNotAllowed,
        errorMessage,
        formsy,
        hasMixedValue,
        labelClassName,
        maxFileSize,
        name,
        onChange,
        queryColumn,
        renderFieldLabel,
        required,
        setValue,
        showLabel = true,
        toggleDisabledTooltip,
    } = props;
    // The initialValue prop is only respected on mount.
    const [data, setData] = useState<FileInputData>(initialData);
    const [error, setError] = useState<string>('');
    const [file, setFile] = useState<File>(null);
    const [isHover, setIsHover] = useState<boolean>(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const { isDisabled, toggleDisabled } = useDisableableInput<FileInputValue>(props);

    // Issue 53394: Distinct input ID so it does not collide with other elements on the page
    const inputId = useMemo(() => generateId('fileUpload-'), []);
    const inputName = name ?? queryColumn.fieldKey;
    const hasCustomFieldLabel = !!renderFieldLabel;
    const hasError = formsy && !!errorMessage;

    const setFormValue = useCallback(
        (file_: File): void => {
            setData(undefined);
            setError('');
            setFile(file_);
            onChange?.({ [inputName]: file_ });

            if (formsy) {
                setValue?.(file_);
            }
        },
        [formsy, inputName, onChange, setValue]
    );

    const processFiles = useCallback(
        (fileList: FileList, transferItems?: DataTransferItemList): void => {
            if (fileList.length > 1) {
                setError('Only one file allowed');
                return;
            }

            if (getTransferItemDirectoryEntry(transferItems, 0)) {
                setError('Folders are not supported, only one file allowed');
                return;
            }

            const file_ = fileList[0];
            if (acceptedFormats) {
                const formatCheck = fileMatchesAcceptedFormat(file_.name, acceptedFormats);
                if (!formatCheck.isMatch) {
                    setError('Invalid file type.');
                    return;
                }
            }

            if (maxFileSize && file_.size > maxFileSize) {
                setError(`File size must not exceed ${Math.round(maxFileSize / 1024).toLocaleString()} KB.`);
                return;
            }
            if (emptyFileNotAllowed && file_.size === 0) {
                setError('Empty file is not allowed.');
                return;
            }
            setFormValue(file_);
        },
        [acceptedFormats, emptyFileNotAllowed, maxFileSize, setFormValue]
    );

    const onInputChange = useCallback<FormEventHandler<HTMLInputElement>>(
        event => {
            cancelEvent(event);
            processFiles(fileInput.current.files);
        },
        [processFiles]
    );

    const onDrag = useCallback<DragEventHandler<HTMLElement>>(event => {
        cancelEvent(event);
        setIsHover(true);
    }, []);

    const onDragLeave = useCallback<DragEventHandler<HTMLElement>>(event => {
        cancelEvent(event);
        setIsHover(false);
    }, []);

    const onDrop = useCallback<DragEventHandler<HTMLElement>>(
        event => {
            cancelEvent(event);

            if (event.dataTransfer && event.dataTransfer.files) {
                processFiles(event.dataTransfer.files, event.dataTransfer.items);
                setIsHover(false);
            }
        },
        [processFiles]
    );

    const onRemove = useCallback((): void => {
        // A value of null is supported by server APIs to clear/remove a file field's value.
        setFormValue(null);
    }, [setFormValue]);

    const labelOverlayProps = useMemo<LabelOverlayProps>(() => {
        if (hasCustomFieldLabel) return undefined;
        return {
            addLabelAsterisk,
            dataKey: inputName,
            // While this component supports binding Formsy, it does not use a Formsy component
            // to render the associated label. As such, the label overlay is always configured as isFormsy={false}.
            isFormsy: false,
            labelClass: allowDisable ? undefined : labelClassName,
            required,
        };
    }, [addLabelAsterisk, allowDisable, hasCustomFieldLabel, inputName, labelClassName, required]);

    const toggleProps = useMemo<Partial<ToggleProps>>(() => {
        if (hasCustomFieldLabel) return undefined;
        return {
            onClick: toggleDisabledTooltip ? undefined : toggleDisabled,
            toolTip: toggleDisabledTooltip,
        };
    }, [hasCustomFieldLabel, toggleDisabled, toggleDisabledTooltip]);

    let body: ReactNode;

    if (file || typeof data === 'string') {
        body = (
            <div
                className={classNames('attached-file__inline-container text__wrap', {
                    'file-upload__is-hover': isHover,
                })}
                onDragEnter={onDrag}
                onDragLeave={onDragLeave}
                onDragOver={onDrag}
                onDrop={onDrop}
            >
                <span className="fa fa-times-circle attached-file__remove-icon" onClick={onRemove} />
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
                onRemove={isDisabled ? undefined : onRemove}
            />
        );
    } else {
        body = (
            <>
                <input
                    className="file-upload__input" // This class makes the file input hidden
                    disabled={isDisabled}
                    id={inputId}
                    multiple={false}
                    name={inputName}
                    onChange={onInputChange}
                    ref={fileInput}
                    type="file"
                />

                {/* We render a label here, so click and drag events propagate to the input above */}
                <label
                    className={classNames('file-upload--compact-label', {
                        'file-upload--is-disabled': isDisabled,
                        'file-upload__is-hover': isHover && !isDisabled,
                    })}
                    htmlFor={inputId}
                    onDragEnter={onDrag}
                    onDragLeave={onDragLeave}
                    onDragOver={onDrag}
                    onDrop={onDrop}
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

    return (
        <div className={classNames('form-group row', { 'has-error': hasError })}>
            {hasCustomFieldLabel && (
                <span className={labelClassName} data-fieldkey={inputName}>
                    {renderFieldLabel(queryColumn)}
                    {required && <span className="required-symbol"> *</span>}
                </span>
            )}
            {!hasCustomFieldLabel && (
                <FieldLabel
                    column={queryColumn}
                    isDisabled={isDisabled}
                    labelOverlayProps={labelOverlayProps}
                    showLabel={showLabel}
                    showToggle={allowDisable}
                    toggleProps={toggleProps}
                />
            )}
            <div className={elementWrapperClassName}>
                {body}
                {hasError && <span className="help-block">{errorMessage}</span>}
            </div>
        </div>
    );
};
FileInputImpl.displayName = 'FileInputImpl';

/**
 * A wrapper around FileInputImpl that binds formsy-react so the element can be validated, submitted, etc.
 */
const FileInputFormsy = withFormsy<FileInputImplProps, FileInputValue>(FileInputImpl);

export const FileInput: FC<FileInputProps> = props => {
    const { formsy = false, initialValue, queryColumn, required = queryColumn?.required ?? false } = props;
    const [{ data, value }] = useState(() => initializeValue(initialValue));

    if (formsy) {
        // GitHub Issue 1388: Pass required and value props to formsy for initialization
        return (
            <FileInputFormsy name={undefined} {...props} formsy initialData={data} required={required} value={value} />
        );
    }

    return <FileInputImpl {...(props as FileInputImplProps)} formsy={false} initialData={data} required={required} />;
};
FileInput.displayName = 'FileInput';
