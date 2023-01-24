import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';

interface Props {
    groups: [{ displayValue: string; value: number }];
}

export const GroupsList: FC<Props> = memo(props => {
    const { groups } = props;

    if (!groups) return null;

    return (
        <>
            <hr className="principal-hr" />
            <Row>
                <Col xs={4} className="principal-detail-label">
                    Groups
                </Col>
                <Col xs={8} className="principal-detail-value">
                    <ul className="principal-detail-ul">
                        {groups.length > 0 ? (
                            groups.map(group => (
                                <li key={group.value} className="principal-detail-li">
                                    {group.displayValue}
                                </li>
                            ))
                        ) : (
                            <li className="principal-detail-li">None</li>
                        )}
                    </ul>
                </Col>
            </Row>
        </>
    );
});
