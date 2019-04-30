import * as React from "react";
import {DomainField} from "../models";
import {Row} from "react-bootstrap";


interface IDomainRowExpandedOptions {
    fieldId: number,
    domainField: DomainField
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptions, any> {

    render() {
        return(
          <Row className='domain-row-expanded domain-row-expanded-height'>
          </Row>
        );
    }
}