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

import { QueryGridModel } from '../base/models/model';

import { FieldEditForm, FieldEditProps } from './input/FieldEditInput';

export interface FieldEditTriggerProps {
    canUpdate?: boolean;
    caption?: string;
    containerPath?: string;
    fieldKeys: List<string>;
    iconField?: string;
    iconAlwaysVisible?: boolean;
    queryModel: QueryGridModel;
    showIconText?: boolean;
    showValueOnNotAllowed?: boolean;
    onUpdate?: () => void;
    handleUpdateRows?: (any) => Promise<any>;
}

interface State {
    error?: string;
    fields?: List<FieldEditProps>;
}

type Props = FieldEditTriggerProps;

export class FieldEditTrigger extends React.Component<Props, State> {
    private fieldEditOverlayTrigger: React.RefObject<OverlayTrigger>;

    static defaultProps = {
        iconAlwaysVisible: true,
        showIconText: true,
        showValueOnNotAllowed: true,
    };

    constructor(props: Props) {
        super(props);
        this.fieldEditOverlayTrigger = React.createRef();

        this.handleOverlayClose = this.handleOverlayClose.bind(this);
        this.updateFields = this.updateFields.bind(this);

        this.state = {
            fields: List<FieldEditProps>(),
        };
    }

    componentDidMount() {
        this.init(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        this.init(nextProps);
    }

    init(props: Props) {
        const { fieldKeys, queryModel } = props;
        if (queryModel.isLoaded && queryModel.queryInfo) {
            const row = queryModel.getRow();
            let fields = List<FieldEditProps>();
            fieldKeys.forEach(key => {
                const column = queryModel.queryInfo.getColumn(key);

                if (column) {
                    const data = row.get(key) || row.get(key.toLowerCase());
                    let value;

                    if (data) {
                        value = data.has('displayValue') ? data.get('displayValue') : data.get('value');
                    }

                    fields = fields.push(
                        new FieldEditProps({
                            caption: column.caption,
                            data,
                            fieldKey: column.fieldKey,
                            inputType: column.inputType,
                            key,
                            value,
                        })
                    );
                } else if (LABKEY.devMode) {
                    const sq = queryModel.queryInfo.schemaQuery;
                    console.warn(
                        `FieldEditTrigger: column "${key}" not available on QueryInfo for "${sq.schemaName}.${sq.queryName}"`
                    );
                }
            });

            this.setState({
                fields,
            });
        }
    }

    handleOverlayClose() {
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

    updateFields(submittedValues) {
        const { containerPath, queryModel, onUpdate, handleUpdateRows } = this.props;

        const row = queryModel.getRow();
        const name = row.getIn(['Name', 'value']);

        if (this.fieldValuesChanged(submittedValues)) {
            const schemaQuery = queryModel.queryInfo.schemaQuery;

            const options: any = {
                schemaQuery,
                rows: [
                    {
                        rowId: queryModel.keyValue,
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
                        error: 'There was a problem updating the data.',
                    });
                });
        }
    }

    render() {
        const { canUpdate, showIconText, showValueOnNotAllowed } = this.props;
        const { error, fields } = this.state;

        const iconField = this.props.iconField ? this.props.iconField : this.props.fieldKeys.get(0);
        const caption = this.props.caption
            ? this.props.caption
            : fields && fields.size > 0
            ? fields.get(0).caption
            : 'Fields';

        let overlayFields = List<FieldEditProps>();
        let haveValues = false;
        let columnKeys = List<string>();
        let fieldValue;
        fields.forEach(field => {
            overlayFields = overlayFields.push(
                new FieldEditProps({
                    caption: field.caption,
                    fieldKey: field.fieldKey,
                    inputPlaceholder: 'Enter a ' + field.caption.toLowerCase() + '...',
                    inputType: field.inputType,
                    value: field.value,
                })
            );
            columnKeys = columnKeys.push(field.fieldKey);
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
                                fields={overlayFields}
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
