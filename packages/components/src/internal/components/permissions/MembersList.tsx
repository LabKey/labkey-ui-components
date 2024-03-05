import React, { FC, memo } from 'react';

import { Col, Row } from 'react-bootstrap';

import { Member } from '../administration/models';
import { UserLink } from '../user/UserLink';

interface Props {
    members: Member[];
}

export const MembersList: FC<Props> = memo(props => {
    const { members } = props;

    return members.length === 0 ? (
        <></>
    ) : (
        <>
            <hr className="principal-hr" />
            <div className="row">
                <Col xs={4} className="principal-detail-label">
                    Members
                </Col>
                <Col xs={8} className="principal-detail-value">
                    <ul className="principal-detail-ul">
                        {members.map(member => (
                            <li key={member.id} className="principal-detail-li">
                                {member.type === 'u' ? (
                                    <UserLink userId={member.id} userDisplayValue={member.name} />
                                ) : (
                                    member.name
                                )}
                            </li>
                        ))}
                    </ul>
                </Col>
            </div>
        </>
    );
});
