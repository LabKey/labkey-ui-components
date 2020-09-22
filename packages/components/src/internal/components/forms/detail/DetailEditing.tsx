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
import React from 'react';
import { Button, Panel } from 'react-bootstrap';
import { List, Map } from 'immutable';
import Formsy from 'formsy-react';
import { AuditBehaviorTypes, Utils } from '@labkey/api';

import { updateRows } from '../../../../query/api';

import { QueryColumn, QueryGridModel } from '../../base/models/model';

import { Alert } from '../../base/Alert';

import { resolveErrorMessage } from '../../../../util/messaging';

import { resolveDetailEditRenderer, resolveDetailRenderer, titleRenderer } from './DetailEditRenderer';
import { Detail } from './Detail';
import { DetailPanelHeader } from './DetailPanelHeader';
import { extractChanges } from './utils';

interface DetailEditingProps {
    queryModel: QueryGridModel;
    queryColumns?: List<QueryColumn>;
    canUpdate: boolean;
    onUpdate?: () => void;
    useEditIcon: boolean;
    appEditable?: boolean;
    asSubPanel?: boolean;
    title?: string;
    cancelText?: string;
    submitText?: string;
    onEditToggle?: (editing: boolean) => any;
    auditBehavior?: AuditBehaviorTypes;
}

interface DetailEditingState {
    canSubmit?: boolean;
    editing?: boolean;
    warning?: string;
    error?: React.ReactNode;
}

export class DetailEditing extends React.Component<DetailEditingProps, DetailEditingState> {
    static defaultProps = {
        useEditIcon: true,
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    constructor(props: DetailEditingProps) {
        super(props);

        this.state = {
            canSubmit: false,
            editing: false,
            warning: undefined,
            error: undefined,
        };
    }

    disableSubmitButton = () => {
        this.setState(() => ({ canSubmit: false }));
    };

    enableSubmitButton = () => {
        this.setState(() => ({ canSubmit: true }));
    };

    handleClick = () => {
        if (Utils.isFunction(this.props.onEditToggle)) {
            this.props.onEditToggle(!this.state.editing);
        }

        this.setState(state => ({
            editing: !state.editing,
            warning: undefined,
            error: undefined,
        }));
    };

    handleFormChange = () => {
        const { warning } = this.state;
        if (warning) {
            this.setState(() => ({ warning: undefined }));
        }
    };

    handleSubmit = values => {
        const { auditBehavior, queryModel, onUpdate } = this.props;
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
                        () => ({ editing: false }),
                        () => {
                            if (onUpdate) {
                                onUpdate();
                            }
                            if (Utils.isFunction(this.props.onEditToggle)) this.props.onEditToggle(false);
                        }
                    );
                })
                .catch(error => {
                    console.error(error);
                    this.setState(() => ({
                        warning: undefined,
                        error: resolveErrorMessage(error, 'data', undefined, 'update'),
                    }));
                });
        } else {
            this.setState(() => ({
                canSubmit: false,
                warning: 'No changes detected. Please update the form and click save.',
                error: undefined,
            }));
        }
    };

    renderEditControls() {
        const { cancelText, submitText } = this.props;
        const { canSubmit } = this.state;
        return (
            <div className="full-width bottom-spacing">
                <Button className="pull-left" onClick={this.handleClick}>
                    {cancelText}
                </Button>
                <Button className="pull-right" bsStyle="success" type="submit" disabled={!canSubmit}>
                    {submitText}
                </Button>
            </div>
        );
    }

    render() {
        const { queryModel, queryColumns, canUpdate, useEditIcon, appEditable, asSubPanel, title } = this.props;
        const { editing, warning, error } = this.state;

        let isEditable = false;
        if (queryModel && queryModel.queryInfo) {
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
                                    queryModel={queryModel}
                                    editingMode={true}
                                    detailRenderer={resolveDetailEditRenderer}
                                    titleRenderer={titleRenderer}
                                />
                            </div>
                        </Panel.Body>
                    </Panel>
                    {this.renderEditControls()}
                    {asSubPanel && <div className="panel-divider-spacing" />}
                </Formsy>
            );
        }

        return (
            <Panel>
                <Panel.Heading>{header}</Panel.Heading>
                <Panel.Body>
                    <Detail
                        queryModel={queryModel}
                        queryColumns={queryColumns}
                        detailRenderer={resolveDetailRenderer}
                    />
                </Panel.Body>
            </Panel>
        );
    }
}
