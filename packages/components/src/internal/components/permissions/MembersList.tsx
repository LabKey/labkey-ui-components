import React, { FC, memo } from 'react';


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
                <div className="col-xs-4 principal-detail-label">
                    Members
                </div>
                <div className="col-xs-8 principal-detail-value">
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
                </div>
            </div>
        </>
    );
});
