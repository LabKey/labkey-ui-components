import React, { FC, memo } from 'react';
import { Col, Row } from 'react-bootstrap';
import {AppURL} from "../../url/AppURL";
import {User} from "../base/models/User";

interface Props {
    currentUser: User;
    groups: [{ displayValue: string; value: number }];
    showLinks?: boolean;
}

export const GroupsList: FC<Props> = memo(props => {
    const { groups, currentUser, showLinks = true } = props;

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
                                    {currentUser.isAdmin && showLinks ? (
                                        <a
                                            href={AppURL.create('admin', 'groups')
                                                .addParam('expand', group.value)
                                                .toHref()}
                                        >
                                            {group.displayValue}
                                        </a>
                                    ) : (
                                        group.displayValue
                                    )}
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
