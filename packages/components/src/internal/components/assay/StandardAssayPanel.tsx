import React, { FC, memo } from "react";
import { Col, Row } from "react-bootstrap";

export const StandardAssayPanel: FC<any> = memo(props => {
    const { children } = props;

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom'}><b>Standard Assay</b><span style={{color: 'gray'}}> (Recommended)</span></div>
                    <p>Standard assays are the most flexible choice for working with experimental data. Use
                        this assay type to customize the format for mapping your experimental results.
                    </p>
                </Col>
            </Row>
            <Row>
                <Col xs={6}>
                    <div className={'margin-bottom margin-top'}>
                        <b>Supported File Types</b>
                    </div>
                    <p>XLS, XLSX, CSV, TSV</p>
                </Col>
            </Row>
            {children}
        </div>
    )
})
