import React, { FC, memo } from 'react';

interface Props {
    groups: string[];
}

export const MembersList: FC<Props> = memo(props => {
    const { groups } = props;

    return (
        <>
            <hr className="principal-hr" />
            <div className="principal-detail-label">Member of:</div>
            <ul className="permissions-groups-ul">
                {groups.map(group => (
                    <li key={group}>{group}</li>
                ))}
            </ul>
        </>
    );
});
