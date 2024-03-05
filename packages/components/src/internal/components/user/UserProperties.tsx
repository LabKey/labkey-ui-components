import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';

interface Props {
    prop: string;
    title: string;
}

export const UserProperties: FC<Props> = memo(props => {
    const { prop, title } = props;

    return (
        <div className="row">
            <Col xs={4} className="principal-detail-label">
                {title}
            </Col>
            <Col xs={8} className="principal-detail-value">
                {prop}
            </Col>
        </div>
    );
});
