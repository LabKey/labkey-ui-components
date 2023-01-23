import React, { FC, memo, useEffect, useState } from 'react';
import { getServerContext, Security } from '@labkey/api';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { LoadingSpinner } from '../base/LoadingSpinner';

interface Props {
    userId: number,
}

export const RolesAndGroups: FC<Props> = memo(props => {
    const { userId } = props;
    const [ loading, setLoading ] = useState<LoadingState>(LoadingState.LOADING);
    const [ groups, setGroups ] = useState<any[]>([]);
    const [ roles, setRoles ] = useState<string[]>([])

    useEffect(() => {
        Security.getUserPermissions({
            containerPath: getServerContext().container.path,
            userId,
            success: data => {
                setGroups(data.container.groups);
                setRoles(data.container.roles);
                setLoading(LoadingState.LOADED);
                console.log("user permissions are", data);
            },
            failure: error => {
                console.log("error getting user permissions", error);
            },
        });

    }, [])

    if (isLoading(loading))
        return <LoadingSpinner />;

    return (
        <>
            <hr className="principal-hr" />
            <div className="principal-detail-label">Groups</div>
            <ul className="permissions-groups-ul">
                {groups.length > 0 ? (
                    groups.map(group => <li key={group.id}>{group.name}</li>)
                ) : (
                    <li className="permissions-groups-member-li permissions-groups-member-none">None</li>
                )}
            </ul>
        </>
    );
});
