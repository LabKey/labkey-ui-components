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
import { List, OrderedMap } from 'immutable';
import { Alert, Button, Modal } from 'react-bootstrap';
import Formsy, { addValidationRule } from 'formsy-react';
import { Input } from 'formsy-react-components';
import { Utils } from '@labkey/api';

import { selectRows } from '../../query/api';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { QueryInfo } from '../base/models/QueryInfo';
import { QueryColumn, SchemaQuery } from '../base/models/model';
import { Tip } from '../base/Tip';

import { getFieldEnabledFieldName, QueryFormInputs } from './QueryFormInputs';

addValidationRule('isPositiveLt', (vs, v, smax) => {
    if (v === '' || v === undefined || isNaN(v)) {
        return true;
    }

    const max = parseInt(smax);
    const i = parseInt(v);

    if (!isNaN(i) && i >= 1 && i <= max) return true;
    return max == 1 ? 'Only 1 allowed' : `Value must be between 1 and ${max}.`;
});

export interface QueryInfoFormProps {
    asModal?: boolean;
    isLoading?: boolean;
    allowFieldDisable?: boolean;
    useDatePicker?: boolean;
    initiallyDisableFields?: boolean;
    disabledFields?: List<string>;
    cancelText?: string;
    // this can be used when you want a form to supply a set of values to populate a grid, which will be filled in with additional data
    // (e.g., if you want to generate a set of samples with common properties but need to provide the individual, unique ids)
    checkRequiredFields?: boolean;
    // if checkRequiredFields is false, showLabelAsterisk to show * for fields that are originally required
    showLabelAsterisk?: boolean;
    errorCallback?: (error: any) => any;
    errorMessagePrefix?: string;
    fieldValues?: any;
    includeCountField?: boolean;
    countText?: string;
    maxCount?: number;
    onCancel?: () => any;
    onHide?: () => any;
    onFormChange?: () => any;
    canSubmitNotDirty?: boolean;
    canSubmitForEdit?: boolean;
    disableSubmitForEditMsg?: string;
    onSubmitForEdit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSubmit?: (data: OrderedMap<string, any>) => Promise<any>;
    onSuccess?: (data: any, submitForEdit: boolean) => any;
    columnFilter?: (col?: QueryColumn) => boolean;
    queryInfo: QueryInfo;
    renderFileInputs?: boolean;
    schemaQuery: SchemaQuery;
    isSubmittedText?: string;
    isSubmittingText?: string;
    submitForEditText?: string;
    submitText?: string;
    title?: string;
    header?: ReactNode;
    footer?: ReactNode;
    singularNoun?: string;
    pluralNoun?: string;
    showErrorsAtBottom?: boolean;
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

export class QueryInfoForm extends React.PureComponent<QueryInfoFormProps, State> {
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

    componentWillMount() {
        const { schemaQuery } = this.props;
        selectRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            maxRows: 0,
        });
    }

    enableSubmitButton = (): void => {
        if (this.state.fieldEnabledCount > 0) this.setState({ canSubmit: true });
    };

    disableSubmitButton = (): void => {
        this.setState({ canSubmit: false });
    };

    handleCancel = (): void => {
        const { onCancel } = this.props;
        if (Utils.isFunction(onCancel)) {
            onCancel();
        }
    };

    handleChange = (): void => {
        const { onFormChange } = this.props;
        if (Utils.isFunction(onFormChange)) {
            onFormChange();
        }

        if (!this.state.isDirty)
            this.setState(() => {
                return {
                    isDirty: true,
                };
            });
    };

    handleSubmitError = (error: any): void => {
        console.error(error);
        const errorMsg = error ? error.exception : 'Your session may have expired or the form may no longer be valid.';
        this.setState({
            errorMsg: 'There was an error submitting the data. ' + errorMsg, // TODO add some actionable text here
            isSubmitting: false,
        });
    };

    filterDisabledFields = (data: any, requiredFields?: string[]): OrderedMap<string, any> => {
        const fieldsToUpdate = this.props.queryInfo.columns.filter(column => {
            const enabledKey = getFieldEnabledFieldName(column);
            return data[enabledKey] === undefined || data[enabledKey] === 'true';
        });

        let filteredData = OrderedMap<string, any>();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (fieldsToUpdate.has(key.toLowerCase()) || requiredFields.indexOf(key) !== -1) {
                    filteredData = filteredData.set(key, data[key]);
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
        const updatedRow = this.filterDisabledFields(row, ['numItems']);
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
        this.setState(() => {
            return {
                submitForEdit,
            };
        });
    };

    onHide = (): void => {
        const { onHide } = this.props;

        if (onHide) {
            onHide();
        }

        this.setState(() => ({ show: false }));
    };

    onCountChange = (field, value): void => {
        this.setState(() => ({ count: value }));
    };

    onFieldsEnabledChange = (fieldEnabledCount: number) => {
        this.setState(() => ({ fieldEnabledCount }));
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
            includeCountField,
            asModal,
            countText,
            footer,
            header,
            isLoading,
            checkRequiredFields,
            showLabelAsterisk,
            maxCount,
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
        } = this.props;
        const { count } = this.state;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }
        let content;

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
                        {includeCountField && (
                            <Input
                                id="numItems"
                                label={countText}
                                labelClassName="control-label text-left"
                                name="numItems"
                                max={maxCount}
                                min={1}
                                onChange={this.onCountChange}
                                required={true}
                                step="1"
                                style={{ width: '125px' }}
                                type="number"
                                validations={`isPositiveLt:${maxCount}`}
                                value={count ? count.toString() : 1}
                            />
                        )}
                        {(header || includeCountField) && <hr />}
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
                <Modal bsSize="large" show={this.state.show} onHide={this.onHide}>
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
