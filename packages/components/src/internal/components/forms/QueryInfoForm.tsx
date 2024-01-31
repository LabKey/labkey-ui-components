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
import { Modal } from 'react-bootstrap';
import Formsy from 'formsy-react';
import { Filter, Utils } from '@labkey/api';

import { Operation } from '../../../public/QueryColumn';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { FormButtons } from '../../FormButtons';

import { SampleCreationTypeModel } from '../samples/models';
import { QueryInfo } from '../../../public/QueryInfo';
import { formatDate, formatDateTime } from '../../util/Date';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { QueryInfoQuantity } from './QueryInfoQuantity';
import { QueryFormInputs, QueryFormInputsProps } from './QueryFormInputs';
import { getFieldEnabledFieldName } from './utils';

export interface QueryInfoFormProps extends Omit<QueryFormInputsProps, 'onFieldsEnabledChange'> {
    asModal?: boolean;
    canSubmitNotDirty?: boolean;
    cancelText?: string;
    countText?: string;
    disabled?: boolean;
    creationTypeOptions?: SampleCreationTypeModel[];
    errorCallback?: (error: any) => void;
    errorMessagePrefix?: string;
    footer?: ReactNode;
    header?: ReactNode;
    hideButtons?: boolean;
    includeCountField?: boolean;
    isLoading?: boolean;
    isSubmittedText?: string;
    isSubmittingText?: string;
    maxCount?: number;
    onFormChange?: () => void;
    // allow passing of full form data, compare with onFormChange
    onFormChangeWithData?: (formData?: any) => void;
    onHide?: () => void;
    onSubmit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSubmitForEdit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSuccess?: (data: any, submitForEdit: boolean) => void;
    operation?: Operation;
    pluralNoun?: string;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    // required by QueryInfoForm
    queryInfo: QueryInfo; // for filtering lookup values in the form
    showErrorsAtBottom?: boolean;
    singularNoun?: string;
    submitForEditText?: string;
    submitText?: string;
    stickyButtons?: boolean;
    title?: string;
}

interface State {
    canSubmit: boolean;
    count: number;
    errorMsg: string;
    fieldEnabledCount: number;
    isDirty: boolean;
    isSubmitted: boolean;
    isSubmitting: boolean;
    show: boolean;
    submitForEdit: boolean;
}

export class QueryInfoForm extends PureComponent<QueryInfoFormProps, State> {
    formRef: React.RefObject<Formsy>;

    static defaultProps: Partial<QueryInfoFormProps> = {
        canSubmitNotDirty: true,
        includeCountField: true,
        countText: 'Quantity',
        cancelText: 'Cancel',
        stickyButtons: true,
        submitForEditText: 'Edit with Grid',
        submitText: 'Submit',
        isSubmittedText: 'Submitted',
        isSubmittingText: 'Submitting...',
        maxCount: MAX_EDITABLE_GRID_ROWS,
        creationTypeOptions: [],
    };

    constructor(props: QueryInfoFormProps) {
        super(props);

        this.formRef = React.createRef();

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

    handleChange = (): void => {
        const { onFormChange, onFormChangeWithData } = this.props;

        onFormChange?.();

        // for tabbed bulk edit/editable grid, needs a way to pass form data from bulk to editable grid without submit
        if (onFormChangeWithData) {
            const row = this.formRef?.['current']?.['getModel']?.();
            if (row) {
                const updatedRow = this.getUpdatedFields(row, ['numItems', 'creationType']);
                onFormChangeWithData(updatedRow);
            }
        }

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

    getUpdatedFields = (data: any, additionalFields?: string[]): OrderedMap<string, any> => {
        const { submitForEdit } = this.state;

        const fieldsToUpdate = this.props.queryInfo.columns.filter(column => {
            const enabledKey = getFieldEnabledFieldName(column);
            return data[enabledKey] === undefined || data[enabledKey] === 'true';
        });

        let filteredData = OrderedMap<string, any>();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (fieldsToUpdate.has(key.toLowerCase()) || additionalFields.indexOf(key) !== -1) {
                    // Date values are Dates not strings. We convert them to strings in the desired format here.
                    // They are converted back to Dates when saving to the server.
                    const col = this.props.queryInfo?.getColumn(key);
                    if (submitForEdit && col?.jsonType === 'date') {
                        if (col.isDateOnlyColumn)
                            filteredData = filteredData.set(key, formatDate(data[key], null, col.format));
                        else filteredData = filteredData.set(key, formatDateTime(data[key], null, col.format));
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
                <Alert>
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
            asModal,
            cancelText,
            canSubmitNotDirty,
            disabled,
            submitForEditText,
            submitText,
            isSubmittedText,
            isSubmittingText,
            onSubmit,
            onSubmitForEdit,
            pluralNoun,
            singularNoun,
            stickyButtons,
            hideButtons,
        } = this.props;

        const { count, canSubmit, fieldEnabledCount, isSubmitting, isSubmitted, submitForEdit, isDirty } = this.state;

        if (hideButtons) return null;

        const inProgressText = isSubmitted ? isSubmittedText : isSubmitting ? isSubmittingText : undefined;
        const suffix = count > 1 ? pluralNoun : singularNoun;
        const showCancel = this.props.onHide !== undefined || this.props.asModal;

        return (
            <FormButtons sticky={stickyButtons && !asModal}>
                {showCancel && (
                    <button className="test-loc-cancel-button btn btn-default" onClick={this.onHide} type="button">
                        {cancelText}
                    </button>
                )}

                {onSubmitForEdit && submitForEditText && (
                    <button
                        className={`test-loc-submit-for-edit-button btn btn-${onSubmit ? 'default' : 'success'}`}
                        disabled={disabled || isSubmitting || !canSubmit || count === 0}
                        onClick={this.setSubmittingForEdit}
                        type="submit"
                    >
                        {submitForEdit && inProgressText ? inProgressText : submitForEditText}
                    </button>
                )}

                {submitText && onSubmit && (
                    <button
                        className="test-loc-submit-button btn btn-success"
                        disabled={
                            disabled ||
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
                    </button>
                )}
            </FormButtons>
        );
    };

    render() {
        // Include all props to support extraction of queryFormInputProps
        const {
            asModal,
            canSubmitNotDirty,
            cancelText,
            countText,
            creationTypeOptions,
            errorCallback,
            footer,
            header,
            includeCountField,
            isLoading,
            isSubmittedText,
            isSubmittingText,
            maxCount,
            onFormChange,
            onHide,
            onSubmit,
            onSubmitForEdit,
            onSuccess,
            pluralNoun,
            showErrorsAtBottom,
            singularNoun,
            submitForEditText,
            submitText,
            title,
            ...queryFormInputProps
        } = this.props;
        const { queryInfo } = queryFormInputProps;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }
        let content;
        const showQuantityHeader = includeCountField || creationTypeOptions.length > 0;
        if (isLoading) {
            content = <LoadingSpinner />;
        } else {
            content = (
                <div className="query-info-form">
                    {header}
                    {!showErrorsAtBottom && this.renderError()}
                    <Formsy
                        className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onChange={this.handleChange}
                        onInvalid={this.disableSubmitButton}
                        ref={this.formRef}
                    >
                        <QueryInfoQuantity
                            creationTypeOptions={creationTypeOptions}
                            includeCountField={includeCountField}
                            maxCount={maxCount}
                            countText={countText}
                            onCountChange={this.onCountChange}
                        />
                        {(header || showQuantityHeader) && <hr />}
                        <QueryFormInputs {...queryFormInputProps} onFieldsEnabledChange={this.onFieldsEnabledChange} />
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
        }

        return content;
    }
}
