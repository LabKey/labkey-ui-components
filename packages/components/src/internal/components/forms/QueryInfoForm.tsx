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
import React, { PureComponent, ReactNode } from 'react';
import { List, OrderedMap } from 'immutable';
import { Alert, Button, Modal } from 'react-bootstrap';
import Formsy from 'formsy-react';
import { Utils } from '@labkey/api';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { formatDateTime, LoadingSpinner, QueryColumn, QueryInfo, SampleCreationTypeModel, Tip } from '../../..';

import { getFieldEnabledFieldName, QueryFormInputs } from './QueryFormInputs';
import { QueryInfoQuantity } from './QueryInfoQuantity';

export interface QueryInfoFormProps {
    allowFieldDisable?: boolean;
    asModal?: boolean;
    cancelText?: string;
    canSubmitForEdit?: boolean;
    canSubmitNotDirty?: boolean;
    // this can be used when you want a form to supply a set of values to populate a grid, which will be filled in with additional data
    // (e.g., if you want to generate a set of samples with common properties but need to provide the individual, unique ids)
    checkRequiredFields?: boolean;
    columnFilter?: (col?: QueryColumn) => boolean;
    countText?: string;
    creationTypeOptions?: SampleCreationTypeModel[];
    disabledFields?: List<string>;
    disableSubmitForEditMsg?: string;
    errorCallback?: (error: any) => void;
    errorMessagePrefix?: string;
    fieldValues?: any;
    footer?: ReactNode;
    header?: ReactNode;
    includeCountField?: boolean;
    initiallyDisableFields?: boolean;
    isLoading?: boolean;
    isSubmittedText?: string;
    isSubmittingText?: string;
    maxCount?: number;
    onCancel?: () => void;
    onFormChange?: () => void;
    onHide?: () => void;
    onSubmit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSubmitForEdit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSuccess?: (data: any, submitForEdit: boolean) => void;
    pluralNoun?: string;
    queryInfo: QueryInfo;
    renderFileInputs?: boolean;
    showErrorsAtBottom?: boolean;
    // if checkRequiredFields is false, showLabelAsterisk to show * for fields that are originally required
    showLabelAsterisk?: boolean;
    singularNoun?: string;
    submitForEditText?: string;
    submitText?: string;
    title?: string;
    useDatePicker?: boolean;
}

interface State {
    show: boolean;
    canSubmit: boolean;
    submitForEdit: boolean;
    isSubmitted: boolean;
    isSubmitting: boolean;
    isDirty: boolean;
    errorMsg: string;
    count: number;
    fieldEnabledCount: number;
}

export class QueryInfoForm extends PureComponent<QueryInfoFormProps, State> {
    static defaultProps: Partial<QueryInfoFormProps> = {
        canSubmitForEdit: true,
        canSubmitNotDirty: true,
        includeCountField: true,
        checkRequiredFields: true,
        countText: 'Quantity',
        cancelText: 'Cancel',
        submitForEditText: 'Edit with Grid',
        submitText: 'Submit',
        isSubmittedText: 'Submitted',
        isSubmittingText: 'Submitting...',
        maxCount: MAX_EDITABLE_GRID_ROWS,
        allowFieldDisable: false,
        useDatePicker: true,
        creationTypeOptions: [],
    };

    constructor(props: QueryInfoFormProps) {
        super(props);

        this.state = {
            show: true,
            fieldEnabledCount: !props.allowFieldDisable || !props.initiallyDisableFields ? 1 : 0, // initial value of 1 is really just a boolean at this point
            canSubmit: !props.includeCountField && !props.checkRequiredFields,
            isSubmitted: false,
            isSubmitting: false,
            isDirty: false,
            errorMsg: undefined,
            count: undefined,
            submitForEdit: false,
        };
    }

    enableSubmitButton = (): void => {
        if (this.state.fieldEnabledCount > 0) this.setState({ canSubmit: true });
    };

    disableSubmitButton = (): void => {
        this.setState({ canSubmit: false });
    };

    handleCancel = (): void => {
        this.props.onCancel?.();
    };

    handleChange = (): void => {
        this.props.onFormChange?.();

        if (!this.state.isDirty) {
            this.setState({ isDirty: true });
        }
    };

    handleSubmitError = (error: any): void => {
        console.error(error);
        const errorMsg = error ? error.exception : 'Your session may have expired or the form may no longer be valid.';
        this.setState({
            errorMsg: 'There was an error submitting the data. ' + errorMsg, // TODO add some actionable text here
            isSubmitting: false,
        });
    };

    getUpdatedFields = (data: any, requiredFields?: string[]): OrderedMap<string, any> => {
        const { submitForEdit } = this.state;

        const fieldsToUpdate = this.props.queryInfo.columns.filter(column => {
            const enabledKey = getFieldEnabledFieldName(column);
            return data[enabledKey] === undefined || data[enabledKey] === 'true';
        });

        let filteredData = OrderedMap<string, any>();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (fieldsToUpdate.has(key.toLowerCase()) || requiredFields.indexOf(key) !== -1) {
                    // Date values are Dates not strings. We convert them to strings in the desired format here.
                    // They are converted back to Dates when saving to the server.
                    const col = this.props.queryInfo?.getColumn(key);
                    if (submitForEdit && col?.jsonType === 'date') {
                        filteredData = filteredData.set(key, formatDateTime(data[key], null, col.format));
                    } else if (col?.jsonType === 'string' && typeof data[key] === 'string') {
                        filteredData = filteredData.set(key, data[key]?.trim());
                    } else {
                        filteredData = filteredData.set(key, data[key]);
                    }
                }
            }
        }

        return filteredData;
    };

    handleValidSubmit = (row: any): void => {
        const { errorCallback, onSubmit, onSubmitForEdit, onSuccess } = this.props;
        const { submitForEdit } = this.state;

        this.setState({
            errorMsg: undefined,
            isSubmitting: true,
        });
        const updatedRow = this.getUpdatedFields(row, ['numItems', 'creationType']);
        const submitFn = submitForEdit ? onSubmitForEdit : onSubmit;

        submitFn(updatedRow).then(
            data => {
                this.setState({
                    errorMsg: undefined,
                    isSubmitted: true,
                    isSubmitting: false,
                    isDirty: false,
                });
                if (Utils.isFunction(onSuccess)) {
                    return onSuccess(data, submitForEdit);
                }
            },
            error => {
                this.handleSubmitError(error);
                if (Utils.isFunction(errorCallback)) {
                    return errorCallback(error);
                }
            }
        );
    };

    isValid = (count: number): boolean => {
        const { maxCount } = this.props;

        return !maxCount || (count !== undefined && count > 0 && count <= maxCount);
    };

    renderError = (): ReactNode => {
        const { errorMessagePrefix } = this.props;
        const { errorMsg } = this.state;
        if (errorMsg) {
            return (
                <Alert bsStyle="danger">
                    {errorMessagePrefix && <strong>{errorMessagePrefix}</strong>} {errorMsg}
                </Alert>
            );
        }
        return null;
    };

    setSubmittingForEdit = (): void => {
        this.setSubmitting(true);
    };

    setSubmittingForSave = (): void => {
        this.setSubmitting(false);
    };

    setSubmitting = (submitForEdit: boolean): void => {
        this.setState({ submitForEdit });
    };

    onHide = (): void => {
        this.props.onHide?.();
        this.setState({ show: false });
    };

    onCountChange = (count: number): void => {
        this.setState({ count });
    };

    onFieldsEnabledChange = (fieldEnabledCount: number): void => {
        this.setState({ fieldEnabledCount });
    };

    renderButtons = (): ReactNode => {
        const {
            cancelText,
            canSubmitNotDirty,
            canSubmitForEdit,
            disableSubmitForEditMsg,
            submitForEditText,
            submitText,
            isSubmittedText,
            isSubmittingText,
            onSubmit,
            onSubmitForEdit,
            pluralNoun,
            singularNoun,
        } = this.props;

        const { count, canSubmit, fieldEnabledCount, isSubmitting, isSubmitted, submitForEdit, isDirty } = this.state;

        const inProgressText = isSubmitted ? isSubmittedText : isSubmitting ? isSubmittingText : undefined;
        const suffix = count > 1 ? pluralNoun : singularNoun;

        let submitForEditBtn;

        if (onSubmitForEdit && submitForEditText) {
            const btnContent = (
                <Button
                    className="test-loc-submit-for-edit-button"
                    bsStyle={onSubmit ? 'default' : 'success'}
                    disabled={isSubmitting || !canSubmitForEdit || !canSubmit || count === 0}
                    onClick={this.setSubmittingForEdit}
                    type="submit"
                >
                    {submitForEdit && inProgressText ? inProgressText : submitForEditText}
                </Button>
            );
            if (!canSubmitForEdit && disableSubmitForEditMsg) {
                submitForEditBtn = (
                    <Tip caption={disableSubmitForEditMsg}>
                        <div className="disabled-button-with-tooltip">{btnContent}</div>
                    </Tip>
                );
            } else {
                submitForEditBtn = btnContent;
            }
        }

        return (
            <div className="form-group no-margin-bottom">
                <div className="col-sm-12">
                    <div className="pull-left">
                        <Button className="test-loc-cancel-button" onClick={this.onHide}>
                            {cancelText}
                        </Button>
                    </div>
                    <div className="btn-group pull-right">
                        {submitForEditBtn}
                        {submitText && onSubmit && (
                            <Button
                                className="test-loc-submit-button"
                                bsStyle="success"
                                disabled={
                                    isSubmitting ||
                                    fieldEnabledCount === 0 ||
                                    !canSubmit ||
                                    count === 0 ||
                                    !(canSubmitNotDirty || isDirty)
                                }
                                onClick={this.setSubmittingForSave}
                                type="submit"
                            >
                                {!submitForEdit && inProgressText ? inProgressText : submitText}
                                {suffix ? ' ' + suffix : null}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {
            asModal,
            footer,
            header,
            isLoading,
            checkRequiredFields,
            showLabelAsterisk,
            renderFileInputs,
            queryInfo,
            fieldValues,
            title,
            allowFieldDisable,
            initiallyDisableFields,
            disabledFields,
            columnFilter,
            showErrorsAtBottom,
            useDatePicker,
            creationTypeOptions,
            includeCountField,
            maxCount,
            countText,
        } = this.props;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }
        let content;
        const showQuantityHeader = includeCountField || creationTypeOptions.length > 0;
        if (isLoading) {
            content = <LoadingSpinner />;
        } else {
            content = (
                <div>
                    {header}
                    {!showErrorsAtBottom && this.renderError()}
                    <Formsy
                        className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onChange={this.handleChange}
                        onInvalid={this.disableSubmitButton}
                    >
                        <QueryInfoQuantity
                            creationTypeOptions={creationTypeOptions}
                            includeCountField={includeCountField}
                            maxCount={maxCount}
                            countText={countText}
                            onCountChange={this.onCountChange}
                        />
                        {(header || showQuantityHeader) && <hr />}
                        <QueryFormInputs
                            renderFileInputs={renderFileInputs}
                            allowFieldDisable={allowFieldDisable}
                            useDatePicker={useDatePicker}
                            initiallyDisableFields={initiallyDisableFields}
                            onFieldsEnabledChange={this.onFieldsEnabledChange}
                            disabledFields={disabledFields}
                            checkRequiredFields={checkRequiredFields}
                            showLabelAsterisk={showLabelAsterisk}
                            queryInfo={queryInfo}
                            columnFilter={columnFilter}
                            fieldValues={fieldValues}
                        />
                        {footer}
                        {showErrorsAtBottom && this.renderError()}
                        {this.renderButtons()}
                    </Formsy>
                </div>
            );
        }

        if (asModal) {
            return (
                <Modal bsSize="large" dialogClassName="form-modal" show={this.state.show} onHide={this.onHide}>
                    {title && (
                        <Modal.Header>
                            <Modal.Title>{title}</Modal.Title>
                        </Modal.Header>
                    )}
                    <Modal.Body>{content}</Modal.Body>
                </Modal>
            );
        } else {
            return content;
        }
    }
}
