/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { ReactNode } from 'react'

import { Alert, Button, Modal } from 'react-bootstrap'
import Formsy from 'formsy-react'
import { Input } from 'formsy-react-components'
import { List } from 'immutable'
import { Utils } from '@labkey/api'
import { QueryInfo, SchemaQuery } from '@glass/base'

import { insertRows, selectRows } from '../../query/api'
import { QueryFormInputs } from './QueryFormInputs'
import { MAX_ADDED_EDITABLE_GRID_ROWS } from "../../constants";


export interface QueryInfoFormProps {
    asModal?: boolean
    cancelText?: string
    errorCallback?: (error: any) => any
    errorMessagePrefix?: string
    fieldValues?: any
    countText?: string,
    maxCount?: number,
    onCancel?: () => any
    onHide?: () => any
    onSuccess?: (data: any) => any
    queryInfo: QueryInfo
    schemaQuery: SchemaQuery
    isSubmittedText?: string
    isSubmittingText?: string
    submitText: string
    title?: string,
    header?: ReactNode
    singularNoun?: string
}


interface State {
    show: boolean
    canSubmit: boolean
    isSubmitted: boolean
    isSubmitting: boolean
    errorMsg: string
    count: number
}

export class QueryInfoForm extends React.Component<QueryInfoFormProps, State> {

    static defaultProps = {
        countText: "Quantity",
        cancelText: "Cancel",
        submitText: "Submit",
        isSubmittedText: "Submitted",
        isSubmittingText: "Submitting...",
        maxCount: MAX_ADDED_EDITABLE_GRID_ROWS
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

        this.state = {
            show: true,
            canSubmit: false,
            isSubmitted: false,
            isSubmitting: false,
            errorMsg: undefined,
            count: undefined
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
        else {
            // dispatch(goBack());
            console.log("goBack() action not yet implemented");
        }
    }

    handleSubmitError(error: any) {
        this.setState({
            errorMsg: error.exception,
            isSubmitting: false
        });
    }

    handleValidSubmit(row: any) {
        const { errorCallback, schemaQuery, onSuccess } = this.props;
        const { count } = this.state;

        this.setState({
            errorMsg: undefined,
            isSubmitting: true
        });

        delete row.numItems;
        let rows = List<any>();
        for (var i = 0; i < count; i++)
            rows = rows.push(row);
        insertRows({
            schemaQuery,
            rows
        }).then((data) => {
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

    setSubmitting() {
        this.setState(() => {
            return {
                errorMsg: undefined,
                isSubmitting: true
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

        const { cancelText, submitText, isSubmittedText, isSubmittingText, singularNoun } = this.props;

        const { count, canSubmit, isSubmitting, isSubmitted } = this.state;

        return (
            <div className="form-group no-margin-bottom">
                <div className="col-sm-12">
                    <div className="pull-left">
                        <Button onClick={this.onHide}>{cancelText}</Button>
                    </div>
                    <div className="btn-group pull-right">
                        <Button
                            bsStyle="success"
                            disabled={!canSubmit || count === 0}
                            onClick={this.setSubmitting}
                            type="submit">
                            {isSubmitted ? isSubmittedText : (isSubmitting ? isSubmittingText : submitText)}{singularNoun ? ' ' + singularNoun : null}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { asModal, countText, header, maxCount, queryInfo, fieldValues, title } = this.props;
        const { count } = this.state;


        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }

        const countError = count !== undefined && !this.isValid(count);

        const content = (
            <div>
                {header}
                {this.renderError()}
                <Formsy className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onInvalid={this.disableSubmitButton}>
                        <Input
                            id="numItems"
                            label={countText}
                            labelClassName={'control-label text-left'}
                            name={"numItems"}
                            max={maxCount}
                            onChange={this.onCountChange}
                            required={true}
                            step={"1"}
                            style={{width: '75px'}}
                            type={"number"}
                            validations={"isInt"}
                            value={count}
                        />
                        {countError &&
                            (<span style={{display: 'inline-block', padding: '6px 8px'}}>
                                 <span className="text-danger">{`Must be <= ${maxCount}`}</span>
                            </span>)
                        }
                    <hr/>
                    <QueryFormInputs
                        queryInfo={queryInfo}
                        fieldValues={fieldValues} />
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
