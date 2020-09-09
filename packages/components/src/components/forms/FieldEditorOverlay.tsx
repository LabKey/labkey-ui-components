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
import { OverlayTrigger } from 'react-bootstrap';
import { List } from 'immutable';

import { updateRows } from '../../query/api';

import { QueryColumn } from '../base/models/model';

import { FieldEditForm, FieldEditProps } from './input/FieldEditInput';
import { QueryInfo, resolveErrorMessage } from '../..';
import { getServerContext } from '@labkey/api';

export interface FieldEditorOverlayProps {
    canUpdate?: boolean;
    caption?: string;
    containerPath?: string;
    fieldProps?: Array<Partial<FieldEditProps>>;
    iconField?: string;
    iconAlwaysVisible?: boolean;
    isLoading: boolean;
    queryInfo: QueryInfo;
    row: any;
    showIconText?: boolean;
    showValueOnNotAllowed?: boolean;
    onUpdate?: () => void;
    handleUpdateRows?: (any) => Promise<any>;
}

interface State {
    error?: string;
    fields?: List<FieldEditProps>;
    iconField: string;
}

type Props = FieldEditorOverlayProps;

export class FieldEditorOverlay extends React.PureComponent<Props, State> {
    private fieldEditOverlayTrigger: React.RefObject<OverlayTrigger>;

    static defaultProps = {
        iconAlwaysVisible: true,
        showIconText: true,
        showValueOnNotAllowed: true,
    };

    constructor(props: Props) {
        super(props);
        this.fieldEditOverlayTrigger = React.createRef();

        this.state = {
            fields: List<FieldEditProps>(),
            iconField: props.iconField ? props.iconField : props.fieldProps[0].key
        };
    }

    componentDidMount() {
        this.init();
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.isLoading && !this.props.isLoading) {
            this.init();
        }
    }

    init() {
        const { fieldProps, isLoading, queryInfo, row } = this.props;

        if (!isLoading && queryInfo) {
            let fields = List<FieldEditProps>();

            fieldProps.forEach(field => {
                const column = queryInfo.getColumn(field.key);

                if (column) {
                    const data = row[field.key] || row[field.key.toLowerCase()];
                    let value;

                    if (data) {
                        value = data['displayValue'] ? data['displayValue'] : data['value'];
                    }
                    let inputType = column.inputType;
                    // TODO handle date and checkbox inputs.
                    if (column.jsonType === 'int' || column.jsonType === 'float') {
                        inputType = "number";
                    }
                    let props = Object.assign({}, field, {
                        caption: column.caption,
                        data,
                        fieldKey: column.fieldKey,
                        inputPlaceholder: 'Enter a ' + column.caption.toLowerCase() + '...',
                        inputType,
                        value,
                    });
                    fields = fields.push(new FieldEditProps(props));

                } else if (getServerContext().devMode) {
                    const sq = queryInfo.schemaQuery;
                    console.warn(
                        `FieldEditTrigger: column "${field.key}" not available on QueryInfo for "${sq.schemaName}.${sq.queryName}"`
                    );
                }
            });

            this.setState({
                fields
            });
        }
    }

    handleOverlayClose = () => {
        document.body.click();
        this.setState({
            error: undefined,
        });
    }

    fieldValuesChanged(submittedValues): boolean {
        const { fields } = this.state;
        return (
            fields.findIndex(field => {
                if (submittedValues[field.getFieldEditInputName()] !== field.value) return true;
            }) >= 0
        );
    }

    getRowId() : string | number {
        const { queryInfo, row } = this.props;
        const pkCols :List<QueryColumn> = queryInfo.getPkCols();
        return row[pkCols.get(0).fieldKey].value;
    }

    updateFields = (submittedValues) => {
        const { containerPath, row, queryInfo, onUpdate, handleUpdateRows } = this.props;

        const name = row.Name?.value;

        if (this.fieldValuesChanged(submittedValues)) {
            const schemaQuery = queryInfo.schemaQuery;

            const options: any = {
                schemaQuery,
                rows: [
                    {
                        rowId: this.getRowId(),
                        name,
                    },
                ],
            };
            this.state.fields.forEach(field => {
                options.rows[0][field.key] = submittedValues[field.getFieldEditInputName()];
            });

            if (containerPath) {
                options.containerPath = containerPath;
            }

            const updateRowsFn = handleUpdateRows ? handleUpdateRows : updateRows;
            return updateRowsFn(options)
                .then(() => {
                    this.handleOverlayClose();

                    if (onUpdate) {
                        onUpdate();
                    }
                })
                .catch(error => {
                    console.error(error);
                    this.setState({
                        error: resolveErrorMessage(error, 'data', 'data', 'updating'),
                    });
                });
        }
    }

    render() {
        const { canUpdate,  showIconText, showValueOnNotAllowed } = this.props;
        const { error, fields, iconField } = this.state;

        const caption = this.props.caption
            ? this.props.caption
            : fields && fields.size > 0
                ? fields.get(0).caption
                : 'Fields';
        let haveValues = false;

        let fieldValue;
        fields.forEach(field => {
            haveValues = haveValues || (field.value !== undefined && field.value !== null && field.value.length != 0);
            if (field.key === iconField) {
                fieldValue = field.value;
            }
        });

        return (
            <>
                {canUpdate && (
                    <OverlayTrigger
                        delayShow={300}
                        placement="bottom"
                        overlay={
                            <FieldEditForm
                                caption={caption}
                                error={error}
                                fields={this.state.fields}
                                hideOverlayFn={this.handleOverlayClose}
                                onSubmitFn={this.updateFields}
                            />
                        }
                        trigger="click"
                        rootClose
                        ref={this.fieldEditOverlayTrigger}
                    >
                        <span className={haveValues ? 'field__set' : 'field__unset'}>
                            <span title={'Edit ' + caption} className="field-edit__icon fa fa-pencil-square-o" />
                            {showIconText && (
                                <span title={fieldValue}>
                                    {haveValues
                                        ? fieldValue
                                            ? fieldValue
                                            : 'Edit ' + caption
                                        : 'Click to add ' + caption}
                                </span>
                            )}
                        </span>
                    </OverlayTrigger>
                )}
                {!canUpdate && showValueOnNotAllowed && <span title={fieldValue}>{fieldValue}</span>}
            </>
        );
    }
}
