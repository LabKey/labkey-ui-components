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
import React, { Component, ReactNode } from 'react';
import { Button, Panel } from 'react-bootstrap';
import { List } from 'immutable';
import Formsy from 'formsy-react';
import { AuditBehaviorTypes } from '@labkey/api';

import { updateRows, Alert, resolveErrorMessage, QueryColumn, QueryGridModel } from '../../../..';

import { Detail } from './Detail';
import { DetailPanelHeader } from './DetailPanelHeader';
import { extractChanges } from './utils';

interface Props {
    appEditable?: boolean;
    asSubPanel?: boolean;
    auditBehavior?: AuditBehaviorTypes;
    cancelText?: string;
    canUpdate: boolean;
    editColumns?: List<QueryColumn>;
    onEditToggle?: (editing: boolean) => void;
    onUpdate?: () => void;
    queryColumns?: List<QueryColumn>;
    queryModel: QueryGridModel;
    submitText?: string;
    title?: string;
    useEditIcon: boolean;
}

interface State {
    canSubmit: boolean;
    editing: boolean;
    error: ReactNode;
    isSubmitting: boolean;
    warning: string;
}

export class DetailEditing extends Component<Props, State> {
    static defaultProps = {
        useEditIcon: true,
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    state: Readonly<State> = {
        canSubmit: false,
        editing: false,
        warning: undefined,
        error: undefined,
        isSubmitting: false,
    };

    disableSubmitButton = (): void => {
        this.setState({ canSubmit: false });
    };

    enableSubmitButton = (): void => {
        this.setState({ canSubmit: true });
    };

    handleClick = (): void => {
        this.props.onEditToggle?.(!this.state.editing);

        this.setState(state => ({
            editing: !state.editing,
            warning: undefined,
            error: undefined,
        }));
    };

    handleFormChange = (): void => {
        const { warning } = this.state;
        if (warning) {
            this.setState(() => ({ warning: undefined }));
        }
    };

    handleSubmit = values => {
        this.setState(() => ({ isSubmitting: true }));

        const { auditBehavior, queryModel, onEditToggle, onUpdate } = this.props;
        const queryData = queryModel.getRow();
        const queryInfo = queryModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;
        const updatedValues = extractChanges(queryInfo, queryData, values);

        // If form contains new values, proceed to update
        if (Object.keys(updatedValues).length > 0) {
            // iterate the set of pkCols for this QueryInfo -- include value from queryData
            queryInfo.getPkCols().forEach(pkCol => {
                const pkVal = queryData.getIn([pkCol.fieldKey, 'value']);

                if (pkVal !== undefined && pkVal !== null) {
                    updatedValues[pkCol.fieldKey] = pkVal;
                } else {
                    console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                }
            });

            return updateRows({
                schemaQuery,
                rows: [updatedValues],
                auditBehavior,
            })
                .then(() => {
                    this.setState(
                        () => ({ isSubmitting: false, editing: false }),
                        () => {
                            onUpdate?.();
                            onEditToggle?.(false);
                        }
                    );
                })
                .catch(error => {
                    console.error(error);
                    this.setState(() => ({
                        warning: undefined,
                        isSubmitting: false,
                        error: resolveErrorMessage(error, 'data', undefined, 'update'),
                    }));
                });
        } else {
            this.setState({
                canSubmit: false,
                warning: 'No changes detected. Please update the form and click save.',
                error: undefined,
                isSubmitting: false,
            });
        }
    };

    render(): ReactNode {
        const {
            cancelText,
            editColumns,
            queryModel,
            queryColumns,
            canUpdate,
            useEditIcon,
            appEditable,
            asSubPanel,
            submitText,
            title,
        } = this.props;
        const { canSubmit, editing, isSubmitting, warning, error } = this.state;

        let isEditable = false;
        if (queryModel?.queryInfo) {
            const hasData = queryModel.getData().size > 0;
            isEditable = hasData && (queryModel.queryInfo.isAppEditable() || appEditable);
        }

        const header = (
            <DetailPanelHeader
                useEditIcon={useEditIcon}
                isEditable={isEditable}
                canUpdate={canUpdate}
                editing={editing}
                title={title}
                onClickFn={this.handleClick}
                warning={warning}
            />
        );

        if (editing && isEditable) {
            return (
                <Formsy
                    onChange={this.handleFormChange}
                    onValidSubmit={this.handleSubmit}
                    onValid={this.enableSubmitButton}
                    onInvalid={this.disableSubmitButton}
                >
                    <Panel bsStyle="info">
                        <Panel.Heading>{header}</Panel.Heading>
                        <Panel.Body>
                            <div className="detail__editing">
                                {error && <Alert>{error}</Alert>}
                                <Detail
                                    editColumns={editColumns}
                                    editingMode
                                    queryColumns={queryColumns}
                                    queryModel={queryModel}
                                />
                            </div>
                        </Panel.Body>
                    </Panel>
                    <div className="full-width bottom-spacing">
                        <Button className="pull-left" onClick={this.handleClick}>
                            {cancelText}
                        </Button>
                        <Button
                            className="pull-right"
                            bsStyle="success"
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                        >
                            {submitText}
                        </Button>
                    </div>
                    {asSubPanel && <div className="panel-divider-spacing" />}
                </Formsy>
            );
        }

        return (
            <Panel>
                <Panel.Heading>{header}</Panel.Heading>
                <Panel.Body>
                    <Detail queryColumns={queryColumns} queryModel={queryModel} />
                </Panel.Body>
            </Panel>
        );
    }
}
