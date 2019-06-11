/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { ReactNode } from 'react'

import { Alert, Button, Modal } from 'react-bootstrap'
import Formsy, { addValidationRule }  from 'formsy-react'
import { Input } from 'formsy-react-components'
import { Utils } from '@labkey/api'
import { QueryInfo, SchemaQuery } from '@glass/base'

import { selectRows } from '../../query/api'
import { QueryFormInputs } from './QueryFormInputs'
import { MAX_ADDED_EDITABLE_GRID_ROWS } from "../../constants";

addValidationRule('isPositiveLt', (vs, v, smax) => {
    if (v === '' || v === undefined || isNaN(v)) {
        return true;
    }

    const max = parseInt(smax);
    const i = parseInt(v);

    return !isNaN(i) && i >= 1 && i <= max ? true : `Value must be between 1 and ${max}.`;
});

export interface QueryInfoFormProps {
    asModal?: boolean
    allowFieldDisable?: boolean
    cancelText?: string
    // this can be used when you want a form to supply a set of values to populate a grid, which will be filled in with additional data
    // (e.g., if you want to generate a set of samples with common properties but need to provide the individual, unique ids)
    checkRequiredFields?: boolean
    errorCallback?: (error: any) => any
    errorMessagePrefix?: string
    fieldValues?: any
    includeCountField?: boolean
    countText?: string
    maxCount?: number
    onCancel?: () => any
    onHide?: () => any
    onSubmitForEdit?: (data: any) => Promise<any>
    onSubmit?: (data: any) => Promise<any>
    onSuccess?: (data: any) => any
    queryInfo: QueryInfo
    renderFileInputs?: boolean
    schemaQuery: SchemaQuery
    isSubmittedText?: string
    isSubmittingText?: string
    submitForEditText?: string
    submitText?: string
    title?: string
    header?: ReactNode
    footer?: ReactNode
    singularNoun?: string
    pluralNoun?: string
}


interface State {
    show: boolean
    canSubmit: boolean
    submitForEdit: boolean
    isSubmitted: boolean
    isSubmitting: boolean
    errorMsg: string
    count: number
}

export class QueryInfoForm extends React.Component<QueryInfoFormProps, State> {

    static defaultProps : Partial<QueryInfoFormProps> = {
        includeCountField: true,
        checkRequiredFields: true,
        countText: "Quantity",
        cancelText: "Cancel",
        submitForEditText: "Edit with Grid",
        submitText: "Submit",
        isSubmittedText: "Submitted",
        isSubmittingText: "Submitting...",
        maxCount: MAX_ADDED_EDITABLE_GRID_ROWS,
        allowFieldDisable: false
    };


    constructor(props: QueryInfoFormProps) {
        super(props);

        this.disableSubmitButton = this.disableSubmitButton.bind(this);
        this.enableSubmitButton = this.enableSubmitButton.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleValidSubmit = this.handleValidSubmit.bind(this);
        this.onHide = this.onHide.bind(this);
        this.onCountChange = this.onCountChange.bind(this);
        this.setSubmitting = this.setSubmitting.bind(this);
        this.setSubmittingForEdit = this.setSubmittingForEdit.bind(this);
        this.setSubmittingForSave = this.setSubmittingForSave.bind(this);

        this.state = {
            show: true,
            canSubmit: false,
            isSubmitted: false,
            isSubmitting: false,
            errorMsg: undefined,
            count: undefined,
            submitForEdit: false,
        };
    }

    componentWillMount() {
        const {  schemaQuery } = this.props;
        selectRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            maxRows: 0
        });
    }

    enableSubmitButton() {
        this.setState({canSubmit: true});
    }

    disableSubmitButton() {
        this.setState({canSubmit: false});
    }

    handleCancel() {
        const { onCancel } = this.props;
        if (Utils.isFunction(onCancel)) {
            onCancel();
        }
    }

    handleSubmitError(error: any) {
        console.error(error);
        this.setState({
            errorMsg: "There was an error submitting the data.  " + error.exception, // TODO add some actionable text here
            isSubmitting: false
        });
    }

    handleValidSubmit(row: any) {
        const { errorCallback, onSubmit, onSubmitForEdit, onSuccess } = this.props;
        const { submitForEdit } = this.state;

        this.setState({
            errorMsg: undefined,
            isSubmitting: true
        });

        const submitFn = submitForEdit ? onSubmitForEdit : onSubmit;

        submitFn(row).then((data) => {
            this.setState({
                errorMsg: undefined,
                isSubmitted: true,
                isSubmitting: false
            });
            if (Utils.isFunction(onSuccess)) {
                return onSuccess(data);
            }
        }, (error) => {
            this.handleSubmitError(error);
            if (Utils.isFunction(errorCallback)) {
                return errorCallback(error);
            }
        });
    }

    isValid(count: number): boolean {
        const { maxCount } = this.props;

        return !maxCount || count !== undefined && count > 0 && count <= maxCount;
    }

    renderError() {
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
    }

    setSubmittingForEdit() {
        this.setSubmitting(true);
    }

    setSubmittingForSave() {
        this.setSubmitting(false);
    }

    setSubmitting(submitForEdit: boolean) {
        this.setState(() => {
            return {
                errorMsg: undefined,
                isSubmitting: true,
                submitForEdit
            }
        });
    }

    onHide() {
        const { onHide } = this.props;

        if (onHide) {
            onHide();
        }

        this.setState(() => {
            return {
                show: false
            }
        });
    }

    onCountChange(field,value) {
        this.setState(() => {
            return {
                count: value
            }
        });
    }

    renderButtons() {

        const { cancelText, submitForEditText, submitText, isSubmittedText, isSubmittingText, onSubmit, onSubmitForEdit, pluralNoun, singularNoun } = this.props;

        const { count, canSubmit, isSubmitting, isSubmitted } = this.state;

        const suffix = (count > 1) ? pluralNoun : singularNoun;
        return (
            <div className="form-group no-margin-bottom">
                <div className="col-sm-12">
                    <div className="pull-left">
                        <Button className={"test-loc-cancel-button"} onClick={this.onHide}>{cancelText}</Button>
                    </div>
                    <div className="btn-group pull-right">
                        {submitForEditText && onSubmitForEdit &&
                        <Button
                            className={"test-loc-submit-for-edit-button"}
                            bsStyle="default"
                            disabled={!canSubmit || count === 0}
                            onClick={this.setSubmittingForEdit}
                            type="submit">
                            {isSubmitted ? isSubmittedText : (isSubmitting ? isSubmittingText : submitForEditText)}
                        </Button>}
                        {submitText && onSubmit &&
                        <Button
                                className={"test-loc-submit-button"}
                                bsStyle="success"
                                disabled={!canSubmit || count === 0}
                                onClick={this.setSubmittingForSave}
                                type="submit">
                            {isSubmitted ? isSubmittedText : (isSubmitting ? isSubmittingText : submitText)}{suffix ? ' ' + suffix : null}
                        </Button>
                        }
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { includeCountField, asModal, countText, footer, header, checkRequiredFields, maxCount, renderFileInputs, queryInfo, fieldValues, title, allowFieldDisable } = this.props;
        const { count } = this.state;


        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }

        const content = (
            <div>
                {header}
                {this.renderError()}
                <Formsy className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onInvalid={this.disableSubmitButton}>
                    {includeCountField && (
                        <>
                            <Input
                                id="numItems"
                                label={countText}
                                labelClassName={'control-label text-left'}
                                name={"numItems"}
                                max={maxCount}
                                onChange={this.onCountChange}
                                required={true}
                                step={"1"}
                                style={{width: '125px'}}
                                type={"number"}
                                validations={`isPositiveLt:${maxCount}`}
                                value={count}
                            />
                        </>)
                    }
                    <hr/>
                    <QueryFormInputs
                        renderFileInputs={renderFileInputs}
                        allowFieldDisable={allowFieldDisable}
                        checkRequiredFields={checkRequiredFields}
                        queryInfo={queryInfo}
                        fieldValues={fieldValues} />
                    {footer}
                    {this.renderButtons()}
                </Formsy>

            </div>
        );

        if (asModal) {
            return (
                <Modal bsSize="large" show={this.state.show} onHide={this.onHide}>
                    {title && (
                        <Modal.Header>
                            <Modal.Title>{title}</Modal.Title>
                        </Modal.Header>
                    )}
                    <Modal.Body>
                        {content}
                    </Modal.Body>
                </Modal>
            )
        }
        else {
            return content;
        }

    }
}
