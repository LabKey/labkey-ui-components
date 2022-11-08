import React from "react";
import { List } from "immutable";
import { Col, FormControl, Row } from "react-bootstrap";
import { DEFAULT_SAMPLE_FIELD_CONFIG } from '../internal/components/samples/constants';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { DomainField, IAppDomainHeader, IFieldChange } from '../internal/components/domainproperties/models';
import { SAMPLE_TYPE } from '../internal/components/domainproperties/PropDescType';
import { createFormInputId } from '../internal/components/domainproperties/utils';
import {
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS
} from '../internal/components/domainproperties/constants';
import { Alert } from '../internal/components/base/Alert';

const ADD_NEW_FIELD_INDEX = -1;
const REQUIRED_SAMPLE_FIELD_MSG = 'A field linking your samples and assay data is required.';

export function protocolHasSample(protocolModel: AssayProtocolModel): string {
    if (!protocolModel.domains.some(domain => domain.fields.some(field=>field.dataType === SAMPLE_TYPE))) {
        return REQUIRED_SAMPLE_FIELD_MSG + ' Add a field of type Sample to the Results Fields section to continue.';
    }
}

export function renderSampleRequiredPanelHeader(config: IAppDomainHeader) {
    return (
        <SampleRequiredDomainHeader {...config} />
    );
}

/**
 * This component contains text and input elements that should be displayed at the top of a DomainForm. They are able to interact with
 * other elements of the form/domain
 */
export class SampleRequiredDomainHeader extends React.PureComponent<IAppDomainHeader> {

    makeFieldChange = (index: number): void => {
        const {onChange, domainIndex} = this.props;

        const change = {
            id: createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index),
            value: SAMPLE_TYPE.name
        } as IFieldChange;

        const requiredChange = {
            id: createFormInputId(DOMAIN_FIELD_REQUIRED, domainIndex, index),
            value: true
        } as IFieldChange;

        onChange(List([change, requiredChange]), index, true);
    };

    addField = (): void => {
        const {onAddField} = this.props;
        if (!onAddField)
            return;

        onAddField(DEFAULT_SAMPLE_FIELD_CONFIG);
    };

    updateFieldType = (e): void => {
        const index = parseInt(e.target.value);
        if (ADD_NEW_FIELD_INDEX === index)
            this.addField();
        else
            this.makeFieldChange(index);
    };

    render() {
        const {domain, modelDomains} = this.props;

        //If domain has no fields don't show header
        if (!domain || !domain.fields || domain.fields.size == 0)
            return null;

        //If sampleField already set then don't show header
        const hasSampleField = modelDomains.some(domain=>domain.fields.some(field => field.dataType === SAMPLE_TYPE));
        if (hasSampleField)
            return null;

        const selectorId = 'sample-required-field-selector';

        return (
            <>
                <Alert bsStyle={'info'}>
                    <Row>
                        <Col xs={12}>{REQUIRED_SAMPLE_FIELD_MSG} This allows exploration of
                            consolidated data in a way that provides greater insight into the connections between
                            your samples and assay data. You can either select one of your existing fields from the input below
                            to set it as the sample lookup, or you can add a new field of type "Sample".</Col>
                    </Row>
                    <Row className={'margin-top'}>
                        <Col xs={3}>
                            Map field as Sample Lookup
                        </Col>
                        <Col xs={6}>
                            <FormControl componentClass="select" id={selectorId} key={selectorId} onChange={this.updateFieldType}>
                                <option key="_default" value={undefined}/>
                                <option value={ADD_NEW_FIELD_INDEX} key={ADD_NEW_FIELD_INDEX}>Add new field</option>
                                {domain.fields.map((field: DomainField, idx: number) => {

                                    const {rangeURI, name} = field;
                                    if (!field.isNew() && rangeURI !== RANGE_URIS.INT)
                                        return;

                                    const displayName = name || `Field ${idx + 1} (Name not set)`;  //Find this easier to read than using a default value

                                    return (
                                        <option key={idx} value={idx}>{displayName}</option>
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
