import React, { FC, memo } from 'react';

interface Props {
    groups: string[];
}

export const MembersList: FC<Props> = memo(props => {
    const { groups } = props;

    return (
        <>
            <hr className="principal-hr" />
            <div className="principal-detail-label">Member of</div>
            <ul className="permissions-groups-ul">
                {groups.length > 0 ? (
                    groups.map(group => <li key={group}>{group}</li>)
                ) : (
                    <li className="permissions-groups-member-li permissions-groups-member-none">None</li>
                )}
            </ul>
        </>
    );
});
