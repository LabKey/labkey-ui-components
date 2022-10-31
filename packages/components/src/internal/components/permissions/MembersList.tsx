import React, { FC, memo } from 'react';

import { Member } from '../administration/models';

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
            <div className="principal-detail-label">Members</div>
            <ul className="permissions-groups-ul">
                {members.map(member => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
        </>
    );
});
