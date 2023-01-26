import React, { FC, useCallback, useState, useEffect } from 'react';

import { User } from '../base/models/User';
import { userCanReadUserDetails } from '../../app/utils';

import { caseInsensitive } from '../../util/utils';

import { selectRowsUserProps, UserDetailsPanel } from './UserDetailsPanel';

interface UserLinkProps {
    currentUser: User;
    userDisplayValue?: string;
    userId: number;
}

export const UserLink: FC<UserLinkProps> = props => {
    const { currentUser, userId, userDisplayValue } = props;
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [targetUserDisplayValue, setTargetUserDisplayValue] = useState<string>();
    const isSelf = userId === currentUser.id;

    useEffect(() => {
        (async () => {
            try {
                if (!!userId && userDisplayValue === undefined) {
                    const targetUser2 = await selectRowsUserProps(userId);
                    setTargetUserDisplayValue(caseInsensitive(targetUser2, 'DisplayName'));
                } else {
                    setTargetUserDisplayValue(userDisplayValue);
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, [userDisplayValue, userId]);

    const toggleDetailsModal = useCallback(() => {
        setShowDetails(current => !current);
    }, []);

    if (!userId) return null;

    if (!isSelf && (!userCanReadUserDetails(currentUser) || !targetUserDisplayValue)) {
        return <span>{targetUserDisplayValue ?? userId}</span>;
    }

    return (
        <>
            <a onClick={toggleDetailsModal} style={{ cursor: 'pointer' }}>
                {targetUserDisplayValue}
            </a>
            {showDetails && (
                <UserDetailsPanel
                    currentUser={currentUser}
                    userId={userId}
                    toggleDetailsModal={toggleDetailsModal}
                    isSelf={!userCanReadUserDetails(currentUser) && isSelf}
                />
            )}
        </>
    );
};

interface UserOrGroup {
    displayName: string;
    id: number;
    type?: string;
}

interface UserLinkListProps {
    currentUser: User;
    users: UserOrGroup[];
}

export const UserLinkList: FC<UserLinkListProps> = ({ currentUser, users }) => {
    return (
        <>
            {users.map((u, i) => (
                <>
                    {i > 0 && <>, </>}
                    {u.type === 'u' || u.type === undefined ? (
                        <UserLink key={u.id} currentUser={currentUser} userId={u.id} userDisplayValue={u.displayName} />
                    ) : (
                        <span>{u.displayName}</span>
                    )}
                </>
            ))}
        </>
    );
};
