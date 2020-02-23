import React from 'react';

import { Alert, Col, FormControl, Row } from 'react-bootstrap';

import {DATE_TYPE, DomainField, IAppDomainHeader, IDomainField, TEXT_TYPE} from '../models';

import {LabelHelpTip, ListModel} from '../../..';
import {List} from "immutable";

// IAppDomainHeader (and some other properties)
export class SetKeyFieldNamePanel extends React.PureComponent<any> {


    onSelectionChange = (e) => {
        const {model, onModelChange, keyField, onAddField} = this.props;
        const {domain} = model;
        const { name, value } = e.target;

        console.log("current keyfield", keyField);
        console.log("SetKeyFieldNamePanel", this.props);
        console.log(name, value);
        console.log(typeof value, value);
        console.log(typeof '-1', '-1');
        console.log(value !== '-1')
        // Selecting non-autoInteger key
        if (value !== '-1') {
            // TODO tuck this into a helper function
            const oldFields = domain.fields as List<DomainField>;
            const oldPKIndex = keyField;

            // if coming from -1, remove it from fields, otherwise

            // Toggle off primary key on deselected field
            const oldKeyField = oldFields.get(oldPKIndex) as DomainField;
            const updatedOldKeyField = oldKeyField.merge({isPrimaryKey: false, required: false}) as DomainField;
            console.log("updatedOldKeyField", oldKeyField);

            // Toggle on primary key on newly selected field
            const newKeyField = oldFields.get(value);
            const updatedNewKeyField = newKeyField.merge({ isPrimaryKey: true, required: true }) as DomainField;

            const fieldsWithoutPK = oldFields.set(oldPKIndex, updatedOldKeyField) as List<DomainField>;
            const fields = fieldsWithoutPK.set(value, updatedNewKeyField);

            let keyType;
            if (updatedNewKeyField.dataType.name === 'int') {
                keyType = 'Integer';
            } else if (updatedNewKeyField.dataType.name === 'string') {
                keyType = 'Varchar';
            }
            const updatedModel = model.merge({
                domain: model.domain.set('fields', fields),
                keyName: updatedNewKeyField.name,
                keyType,
            }) as ListModel;

            onModelChange(updatedModel, name, value);
            // also need to update keyField on ListDesigner Panels?
        } else {
            console.log("let;s fucking go");
            const autoIncrementFieldConfig = {
                required: true,
                name: 'Auto increment key (placeholder)',
                dataType: DATE_TYPE,
                // conceptURI: DATE_TYPE.conceptURI,
                rangeURI: DATE_TYPE.rangeURI
            } as Partial<IDomainField>;
            onAddField(autoIncrementFieldConfig);
            // new field needs to be of type auto increment, with locked type, and go away when another

        }
    };

    render() {
        let fieldNames = [];
        if (this.props.domain) {
            const fields = this.props.domain.fields;

            fieldNames =
                fields &&
                fields.reduce(function(accum: string[], field: IDomainField) {
                    const dataType = field.dataType.name;
                    if (
                        (dataType == 'string' || dataType == 'int') &&
                        typeof field.name !== 'undefined' &&
                        field.name.trim().length > 0
                    ) {
                        accum.push(field.name);
                    }
                    return accum;
                }, []);
        }

        const { onKeyFieldChange, keyField } = this.props;
        return (
            <Alert>
                <div>
                    Select a key value for this list which uniquely identifies the item. You can use "Auto integer key"
                    to define your own below.
                </div>
                <Row style={{ marginTop: '15px' }}>
                    <Col xs={3} style={{ color: 'black' }}>
                        Key Field Name
                        <LabelHelpTip
                            title=""
                            body={() => {
                                return <> Only integer or text fields can be made the primary key. </>;
                            }}
                        />
                        *
                    </Col>
                    <Col xs={3}>
                        <FormControl
                            componentClass="select"
                            name="keyField"
                            onChange={e => this.onSelectionChange(e)}
                            value={keyField}
                            style={{ width: '200px' }}>
                            {/* <option disabled value={-2}>*/}
                            {/*    Select a field from the list*/}
                            {/* </option>*/}
                            <option value={-1}>Auto integer key</option>

                            {fieldNames.map((fieldName, index) => {
                                return (
                                    <option value={index} key={index + 1}>
                                        {fieldName}
                                    </option>
                                );
                            })}
                        </FormControl>
                    </Col>
                </Row>
            </Alert>
        );
    }
}
