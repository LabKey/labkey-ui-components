/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

import { Alert, Modal } from 'react-bootstrap'
import Formsy from 'formsy-react'
import {List} from 'immutable'
import {Utils} from '@labkey/api'
import {QueryInfo, SchemaQuery} from '@glass/base'

import {insertRows, selectRows} from '../../query/api'
import {QueryFormInputs} from './QueryFormInputs'

export interface QueryInfoFormProps {
    asModal?: boolean
    errorCallback?: (error: any) => any
    errorMessagePrefix?: string
    fieldValues?: any
    onCancel?: () => any
    onSuccess?: (data: any) => any
    queryInfo: QueryInfo
    schemaQuery: SchemaQuery
}


interface State {
    show: boolean
    canSubmit: boolean
    isSubmitted: boolean
    isSubmitting: boolean
    errorMsg: string
}

export class QueryInfoForm extends React.Component<QueryInfoFormProps, State> {

    constructor(props: QueryInfoFormProps) {
        super(props);

        this.disableSubmitButton = this.disableSubmitButton.bind(this);
        this.enableSubmitButton = this.enableSubmitButton.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleValidSubmit = this.handleValidSubmit.bind(this);
        this.onHide = this.onHide.bind(this);

        this.state = {
            show: true,
            canSubmit: false,
            isSubmitted: false,
            isSubmitting: false,
            errorMsg: undefined
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
        const {  onCancel } = this.props;
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

        this.setState({
            errorMsg: undefined,
            isSubmitting: true
        });

        //ToDo: Use queryInfo to validate submission
        insertRows({
            schemaQuery,
            rows: List.of(row)
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

    onHide() {
        console.log("modal hidden");
        this.setState({
            show:false
        });
    }

    render() {
        const { asModal, queryInfo, fieldValues } = this.props;
        const { canSubmit, isSubmitted, isSubmitting } = this.state;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }

        const content = (
            <div>
                {this.renderError()}
                <Formsy className="form-horizontal"
                        onValidSubmit={this.handleValidSubmit}
                        onValid={this.enableSubmitButton}
                        onInvalid={this.disableSubmitButton}>
                    <QueryFormInputs
                        queryInfo={queryInfo}
                        fieldValues={fieldValues} />
                </Formsy>
            </div>
        );

        if (asModal) {
            return (
                <Modal bsSize="large" show={this.state.show} onHide={this.onHide}>
                    <Modal.Body>
                        {content}
                    </Modal.Body>
                </Modal>
            )
        }
        else
            return content;
    }
}
