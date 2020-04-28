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

import { updateRows } from '../../../query/api';

import { QueryColumn, QueryGridModel } from '../../base/models/model';

import { Alert } from '../../base/Alert';

import { resolveErrorMessage } from '../../../util/messaging';

import { resolveDetailEditRenderer, resolveDetailRenderer, titleRenderer } from './DetailEditRenderer';
import { Detail } from './Detail';
import { DetailPanelHeader } from './DetailPanelHeader';

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

    arrayListIsEqual(valueArr: Array<string | number>, nestedModelList: List<Map<string, any>>): boolean {
        let matched = 0;
        // Loop through the submitted array and the existing list and compare values.
        // If values match, add tally. If submitted values length is same as existing list, consider them equal.
        // Note: caller should have checked against empty array and list before function.
        nestedModelList.forEach(nestedField => {
            return valueArr.forEach(nestedVal => {
                if (nestedField.get('value') === nestedVal || nestedField.get('displayValue') === nestedVal) {
                    matched++;
                }
            });
        });

        return matched === valueArr.length;
    }

    disableSubmitButton = () => {
        this.setState(() => ({ canSubmit: false }));
    };

    enableSubmitButton = () => {
        this.setState(() => ({ canSubmit: true }));
    };

    getEditedValues(values): { [propName: string]: any } {
        const { queryModel } = this.props;
        const queryData = queryModel.getRow();
        const queryInfo = queryModel.queryInfo;
        const updatedValues = {};

        // Loop through submitted values and check against existing values from server
        Object.keys(values).forEach(field => {
            // If nested value, will need to do deeper check
            if (List.isList(queryData.get(field))) {
                // If the submitted value and existing value are empty, do not update field
                if (!values[field] && queryData.get(field).size === 0) {
                    return false;
                }
                // If the submitted value is empty and there is an existing value, should update field
                else if (!values[field] && queryData.get(field).size > 0) {
                    updatedValues[field] = values[field];
                } else {
                    // If submitted value array and existing value array are different size, should update field
                    if (values[field].length !== queryData.get(field).size) {
                        updatedValues[field] = values[field];
                    }
                    // If submitted value array and existing array are the same size, need to compare full contents
                    else if (values[field].length === queryData.get(field).size) {
                        if (!this.arrayListIsEqual(values[field], queryData.get(field))) {
                            updatedValues[field] = values[field];
                        }
                    }
                }
            } else if (values[field] != queryData.getIn([field, 'value'])) {
                const column = queryInfo.getColumn(field);

                // A date field needs to be checked specially
                if (column && column.jsonType === 'date') {
                    // Ensure dates have same formatting
                    // If submitted value is same as existing date down to the minute (issue 40139), do not update
                    const newDateValue = new Date(values[field]).setUTCSeconds(0, 0);
                    const origDateValue = new Date(queryData.getIn([field, 'value'])).setUTCSeconds(0, 0);
                    if (newDateValue === origDateValue) {
                        return false;
                    }
                }

                updatedValues[field] = values[field];
            }
        });

        return updatedValues;
    }

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

        const updatedValues = this.getEditedValues(values);

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
