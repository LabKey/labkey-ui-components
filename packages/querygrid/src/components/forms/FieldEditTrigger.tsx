/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import { List, Map } from 'immutable'
import { QueryGridModel } from '@glass/base'

import { updateRows } from '../../query/api'
import { FieldEditForm, FieldEditProps } from './input/FieldEditInput'

export interface FieldEditTriggerProps {
    canUpdate?: boolean
    caption?: string
    containerPath?: string
    fieldKeys: List<string>
    iconField?: string
    iconAlwaysVisible?: boolean
    queryModel: QueryGridModel
    showIconText?: boolean
    showValueOnNotAllowed?: boolean
    onUpdate?: () => void
}

interface State {
    error?: string
    fields?: List<FieldEditProps>
}

type Props = FieldEditTriggerProps;

export class FieldEditTrigger extends React.Component<Props, State> {

    private fieldEditOverlayTrigger: React.RefObject<OverlayTrigger>;

    static defaultProps = {
        iconAlwaysVisible: true,
        showIconText: true,
        showValueOnNotAllowed: true
    };

    constructor(props: Props) {
        super(props);
        this.fieldEditOverlayTrigger = React.createRef();

        this.handleOverlayClose = this.handleOverlayClose.bind(this);
        this.updateFields = this.updateFields.bind(this);

        this.state = {
            fields: List<FieldEditProps>()
        };
    }

    componentDidMount() {
        this.init(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        this.init(nextProps);
    }

    init(props: Props) {
        const { fieldKeys, queryModel } = props;
        if (queryModel.isLoaded) {
            const row = queryModel.getRow();
            let fields = List<FieldEditProps>().asMutable();
            let fieldData = Map<string, any>().asMutable();
            fieldKeys.forEach((key) => {
                const column = queryModel.queryInfo.getColumn(key);

                if (column) {
                    const data = row.get(key) || row.get(key.toLowerCase());
                    let value;

                    if (data) {
                        value = data.has('displayValue') ? data.get('displayValue') : data.get('value');
                    }

                    fields.push(new FieldEditProps({
                        caption: column.caption,
                        data,
                        fieldKey: column.fieldKey,
                        inputType: column.inputType,
                        key,
                        value
                    }));

                    fieldData.set(key, data);
                }
                else if (LABKEY.devMode) {
                    const sq = queryModel.queryInfo.schemaQuery;
                    console.warn(`FieldEditTrigger: column "${key}" not available on QueryInfo for "${sq.schemaName}.${sq.queryName}"`);
                }
            });

            this.setState({
                fields: fields.asImmutable()
            });
        }
    }

    handleOverlayClose() {
        document.body.click();
        this.setState ({
            error: undefined
        });
    }

    fieldValuesChanged(submittedValues): boolean {
        const { fields } = this.state;
        return fields.findIndex((field) => {
            if (submittedValues[field.getFieldEditInputName()] !== field.value)
                return true;
        }) >= 0;
    }

    updateFields(submittedValues) {
        const { containerPath, queryModel, onUpdate } = this.props;

        const row = queryModel.getRow();
        const name = row.getIn(['Name', 'value']);

        if (this.fieldValuesChanged(submittedValues)) {
            const schemaQuery = queryModel.queryInfo.schemaQuery;

            let options: any = {
                schemaQuery,
                rows: [{
                    rowId: queryModel.keyValue,
                    name
                }]
            };
            this.state.fields.forEach((field) => {
                options.rows[0][field.key] = submittedValues[field.getFieldEditInputName()]
            });

            if (containerPath) {
                options.containerPath = containerPath;
            }
            return updateRows(options).then(() => {
                this.handleOverlayClose();

                if (onUpdate) {
                    onUpdate();
                }
            }).catch((error) => {
                this.setState({
                    error: error.exception
                });
            });
        }
    }

    render() {
        const { canUpdate, showIconText, showValueOnNotAllowed } = this.props;
        const { error, fields } = this.state;

        const iconField = this.props.iconField ? this.props.iconField : this.props.fieldKeys.get(0);
        const caption = this.props.caption ? this.props.caption : (fields && fields.size > 0 ? fields.get(0).caption  : 'Fields');

        let overlayFields = List<FieldEditProps>().asMutable();
        let haveValues = false;
        let columnKeys = List<string>().asMutable();
        let fieldValue = undefined;
        fields.forEach( (field) => {
           overlayFields.push(new FieldEditProps({
               caption: field.caption,
               fieldKey: field.fieldKey,
               inputPlaceholder: 'Enter a ' + field.caption.toLowerCase() + '...',
               inputType: field.inputType,
               value: field.value
           }));
           columnKeys.push(field.fieldKey);
           haveValues = haveValues || (field.value !== undefined && field.value !== null &&  field.value.length != 0);
           if (field.key === iconField) {
               fieldValue = field.value;
           }
        });

        return (
            <>
                {canUpdate &&
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
                                <span title={'Edit ' + caption}
                                      className="field-edit__icon fa fa-pencil-square-o"/>
                                {showIconText &&
                                    <span title={fieldValue}>
                                        {haveValues ? (fieldValue ? fieldValue : 'Edit ' + caption) : 'Click to add ' + caption}
                                    </span>
                                }
                            </span>
                    </OverlayTrigger>
                }
                {!canUpdate && showValueOnNotAllowed &&
                    <span title={fieldValue}>{fieldValue}</span>
                }
            </>
        )
    }
}