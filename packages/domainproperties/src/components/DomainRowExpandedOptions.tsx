import * as React from "react";
import { Col, Row } from "react-bootstrap";
import {Alert} from "@glass/base";

import {DomainField} from "../models";

interface IDomainRowExpandedOptions {
    domainField: DomainField
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptions, any> {

    render() {
        return(
          <Row className='domain-row-expanded'>
              <Col xs={12}>
                <Alert bsStyle={'info'}>Expanded state domain row options coming soon...</Alert>
              </Col>
          </Row>
        );
    }
}