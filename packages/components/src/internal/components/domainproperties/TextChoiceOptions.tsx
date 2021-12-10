import React, { FC, memo, useCallback } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { ITypeDependentProps } from './models';
import { SectionHeading } from "./SectionHeading";
import { DomainFieldLabel } from "./DomainFieldLabel";

const HELP_TIP_BODY = (
    <p>
        TODO: ...
    </p>
);

interface TextChoiceProps extends ITypeDependentProps {
    // TODO
}

export const TextChoiceOptions: FC<TextChoiceProps> = memo(props => {
    const { label } = props;

    return (
        <div>
            <Row>
                <Col xs={12}>
                    <SectionHeading title={label} />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="domain-field-label">
                        <DomainFieldLabel label="Drop-down Values" helpTipBody={HELP_TIP_BODY} />
                    </div>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <p>Coming soon...</p>
                </Col>
            </Row>
        </div>
    );
});
