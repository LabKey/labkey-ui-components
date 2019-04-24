/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

import {Alert} from 'react-bootstrap'
import Formsy from 'formsy-react'
import {List} from 'immutable'
import {Utils} from '@labkey/api'
import {QueryInfo, SchemaQuery} from '@glass/base'

import {insertRows, selectRows} from '../../query/api'
import {QueryFormInputs} from './QueryFormInputs'

interface Props {
    errorCallback?: (error: any) => any
    fieldValues?: any
    onCancel?: () => any
    onSuccess?: (data: any) => any
    queryInfo: QueryInfo
    schemaQuery: SchemaQuery
}


interface State {
    canSubmit: boolean
    isSubmitted: boolean
    isSubmitting: boolean
    errorMsg: string
}

export class QueryInfoForm extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.disableSubmitButton = this.disableSubmitButton.bind(this);
        this.enableSubmitButton = this.enableSubmitButton.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleValidSubmit = this.handleValidSubmit.bind(this);

        this.state = {
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
        const { errorMsg } = this.state;
        if (errorMsg) {
            return (
                <Alert bsStyle="danger">
                    <strong>Oh snap!</strong> {errorMsg}
                </Alert>
            );
        }
        return null;
    }

    render() {
        const { queryInfo, fieldValues } = this.props;
        const { canSubmit, isSubmitted, isSubmitting } = this.state;

        if (!queryInfo || queryInfo.isLoading) {
            return null;
        }

        return (
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
    }
}
