import React from 'react';

import { Alert, Col, FormControl, Row } from 'react-bootstrap';

import { IAppDomainHeader, IDomainField } from '../models';
import { LabelHelpTip } from '../../..';

export class SetKeyFieldNamePanel extends React.PureComponent<IAppDomainHeader> {
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
        console.log('SetKeyFieldNamePanelProps', this.props);
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
                            onChange={e => onKeyFieldChange(e)}
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
