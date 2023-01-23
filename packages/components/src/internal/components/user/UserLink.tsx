import React, { FC, useCallback, useState } from 'react';
import { List } from 'immutable';
import { User as IUser } from '@labkey/api';

import { User } from '../base/models/User';
import { userCanReadUserDetails } from '../../app/utils';
import { UserDetailsPanel } from './UserDetailsPanel';

interface Props {
    allUsers: List<IUser>;
    currentUser: User;
    userId: string;
}

export const UserLink : FC<Props> = (props) =>  {

    const { allUsers, currentUser, userId } = props;
    const [ showDetails, setShowDetails ] = useState<boolean>(false);

    const toggleDetailsModal = useCallback(() => {
        setShowDetails(!showDetails);
    }, [showDetails]);

    if (!allUsers || !userId) return null;

    let targetUser: IUser = null;
    if (allUsers) {
        targetUser = allUsers.find(user => user.userId === parseInt(userId));
    }

    if (!targetUser)
        return null;

    if (!userCanReadUserDetails(currentUser))
        return <>{targetUser.displayName}</>;

    return (
        <>
            <a onClick={toggleDetailsModal}>{targetUser.displayName}</a>;
            {showDetails && (
                <UserDetailsPanel userId={targetUser.userId} asModal/>
            )}
        </>
    )

}
