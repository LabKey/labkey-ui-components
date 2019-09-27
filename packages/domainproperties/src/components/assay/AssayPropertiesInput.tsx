import * as React from 'react';
import { Col, Row } from "react-bootstrap";
import { LabelHelpTip } from "@glass/base";

interface Props {
    label: string
    required?: boolean
    colSize?: number
    helpTipBody?: () => any
}

export class AssayPropertiesInput extends React.PureComponent<Props, any> {
    render() {
        const { label, required, helpTipBody, colSize, children } = this.props;

        return (
            <Row className={'margin-top'}>
                <Col xs={3}>
                    {label}
                    {required ? <small> (Required)</small> : ''}
                    {helpTipBody &&
                        <LabelHelpTip
                            title={label}
                            body={helpTipBody}
                        />
                    }
                </Col>
                <Col xs={colSize || 9}>
                    {children}
                </Col>
            </Row>
        )
    }
}