import React from 'react';
import { Alert, Col, FormControl, Row } from 'react-bootstrap';
import {List} from "immutable";
import {DATE_TYPE, DomainField, IDomainField} from '../models';
import {LabelHelpTip, ListModel} from '../../..';

// TODO: define props - IAppDomainHeader (and some other properties, model, onModelChange, keyField, onAddField)
export class SetKeyFieldNamePanel extends React.PureComponent<any> {

    setKeyField = (fields, newKey) => {
        const newKeyField = fields.get(newKey);
        const updatedNewKeyField = newKeyField.merge({ isPrimaryKey: true, required: true }) as DomainField;
        return fields.set(newKey, updatedNewKeyField) as List<DomainField>;
    };

    unsetKeyField = (fields, prevKey) => {
        const prevKeyField = fields.get(prevKey) as DomainField;
        const updatedPrevKeyField = prevKeyField.merge({isPrimaryKey: false, required: false}) as DomainField;
        return fields.set(prevKey, updatedPrevKeyField) as List<DomainField>;
    };

    addAutoIntField = (onAddField, onModelChange, name, value) => {
        const autoIncrementFieldConfig = {
            required: true,
            name: 'Auto increment key (placeholder)',
            dataType: DATE_TYPE,
            // conceptURI: DATE_TYPE.conceptURI,
            rangeURI: DATE_TYPE.rangeURI,
            isPrimaryKey: true

        } as Partial<IDomainField>;
        onModelChange(name, value);
        onAddField(autoIncrementFieldConfig);
    };

    removeAutoIntField = (fields) => { //TODO RP: propertly identify the field by its dataType
        return fields.filter((field) => {
            return field.get('name') !== 'Auto increment key (placeholder)'
        }) as List<DomainField>;

    };

    onSelectionChange = (e) => {
        const {model, onModelChange, keyField, onAddField, onDomainChange} = this.props;
        const {domain} = model;
        const {fields} = domain;
        const { name, value } = e.target;

        let newFields;

        // Making first selection of key
        if (keyField == '-2') {
            if (value == '-1') {
                this.addAutoIntField(onAddField, onModelChange, name, value); // Selecting auto int key
                return;
            } else {
                newFields = this.setKeyField(fields, value);  // Selecting regular field
            }
        // Changing key from one field to another
        } else {
            if (keyField == '-1') {
                const fieldsNoKey = this.removeAutoIntField(fields); // Auto int to regular field
                newFields = this.setKeyField(fieldsNoKey, value);
            } else if (value == '-1') {
                newFields = this.unsetKeyField(fields, keyField); // Regular to auto int field

                onDomainChange(domain.merge({fields: newFields}));
                console.log("Old key field correct un-set.");

                this.addAutoIntField(onAddField, onModelChange, name, value);
                return;
            } else if (value !== '-1') {
                const fieldsNoKey = this.unsetKeyField(fields, keyField); // Regular to regular field
                newFields = this.setKeyField(fieldsNoKey, value);
            }
        }

        const newKeyField = fields.get(value);
        let keyType;
        if (newKeyField.dataType.name === 'int') {
            keyType = 'Integer';
        } else if (newKeyField.dataType.name === 'string') {
            keyType = 'Varchar';
        }

        const updatedModel = model.merge({
            domain: model.domain.set('fields', newFields),
            keyName: newKeyField.name,
            keyType,
        }) as ListModel;

        onModelChange(name, value, updatedModel);
    };

    render() {
        const { keyField } = this.props;
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
        const autoIntIsPK = (keyField == '-1');
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
                            style={{ width: '200px' }}
                        >
                            <option disabled value={-2}> Select a field from the list </option>

                            {!autoIntIsPK &&
                                <option value={-1}>Auto integer key</option>
                            }

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
