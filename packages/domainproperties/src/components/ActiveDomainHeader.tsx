import * as React from "react";
import { List } from "immutable";
import { Col, FormControl, Row } from "react-bootstrap";
import {DomainDesign, DomainField, IDomainField, IFieldChange, SAMPLE_TYPE} from "../models";
import {Alert} from "@glass/base";
import {createFormInputId} from "../actions/actions";
import {DOMAIN_FIELD_TYPE, DOMAIN_FIELD_REQUIRED, STRING_RANGE_URI} from "../constants";

interface IActiveDomainHeader {
    domain: DomainDesign
    onChange: (changes: List<IFieldChange>, index: number, expand: boolean) => void
    onAddField?: (fieldConfig: Partial<IDomainField>) => void
    // onRemoveField?:() => void
}

const ADD_NEW_FIELD_INDEX = -1;
/**
 * This component contains text and input elements that should be displayed at the top of a DomainForm and interact with
 * other elements of the form/domain
 */
export class SampleRequiredDomainHeader extends React.PureComponent<IActiveDomainHeader> {

    makeFieldChange = (index: number): void => {
        const {onChange} = this.props;

        const change = {
            id: createFormInputId(DOMAIN_FIELD_TYPE, index),
            value: SAMPLE_TYPE.name
        } as IFieldChange;

        const requiredChange = {
            id: createFormInputId(DOMAIN_FIELD_REQUIRED, index),
            value: true
        } as IFieldChange;

        onChange(List([change, requiredChange]), index, true);
    };

    addField = (): void => {
        const {onAddField} = this.props;
        if (!onAddField)
            return;

        const newField = {
            required: true,
            dataType: SAMPLE_TYPE,
            conceptURI: SAMPLE_TYPE.conceptURI,
            rangeURI: SAMPLE_TYPE.rangeURI,
            lookupSchema: 'samples',
            lookupType: SAMPLE_TYPE.set('rangeURI', STRING_RANGE_URI)
        } as Partial<IDomainField>;

        onAddField(newField);
    };

    updateFieldType = (e): void => {
        const index = parseInt(e.target.value);
        if (ADD_NEW_FIELD_INDEX === index)
            this.addField();
        else
            this.makeFieldChange(index);
    };

    render() {
        const {domain} = this.props;

        return (
            <>
                <Alert bsStyle={'info'}>
                    <Row>
                        <Col xs={12}>A field linking your samples and assay data is required. This allows exploration of
                            consolidated data in a way that provides greater insight into the connections between
                            your samples and assay data. You can either select one of your existing columns from the input below
                            to set it as the sample lookup, or you can add a new field of type "Sample".</Col>
                    </Row>
                    <Row className={'margin-top'}>
                        <Col xs={3}>
                            Map field as Sample Lookup
                        </Col>
                        <Col xs={6}>
                            {/*TODO: Change id and key*/}
                            <FormControl componentClass="select" id={'testing123'} key={'tacocat'} onChange={this.updateFieldType}>
                                <option key="_default" value={undefined}/>
                                <option value={ADD_NEW_FIELD_INDEX} key={ADD_NEW_FIELD_INDEX}>Add new field</option>
                                {domain.fields.map((field: DomainField, idx: number) => {
                                    return (
                                        <option key={idx} value={idx}>{field.name}</option>
                                    );
                                })}
                            </FormControl>
                        </Col>
                    </Row>
                </Alert>
            </>
        );
    }
}