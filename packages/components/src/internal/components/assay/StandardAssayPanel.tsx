import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';

import { AssayProvider } from './AssayPicker';

interface StandardAssayPanelProps {
    provider?: AssayProvider;
}

export const StandardAssayPanel: FC<StandardAssayPanelProps> = memo(props => {
    const { provider, children } = props;

    return (
        <div>
            <Row>
                <Col xs={6}>
                    <div className="margin-bottom">
                        <b>Standard Assay</b>
                        <span className="gray-text"> (Recommended)</span>
                    </div>
                    <p>
                        Standard assays are the most flexible choice for working with experimental data. Use this assay
                        type to customize the format for mapping your experimental results.
                    </p>
                </Col>
            </Row>
            <Row>
                <Col xs={6}>
                    <div className="margin-bottom margin-top">
                        <b>Supported File Types</b>
                    </div>
                    <p>{provider?.fileTypes.join(', ')}</p>
                </Col>
            </Row>
            {children}
        </div>
    );
});
