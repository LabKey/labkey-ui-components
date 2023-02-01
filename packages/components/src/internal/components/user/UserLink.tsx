import React, { FC, useCallback, useState, useEffect } from 'react';

import { User } from '../base/models/User';
import { userCanReadUserDetails } from '../../app/utils';

import { caseInsensitive } from '../../util/utils';

import { selectRowsUserProps, UserDetailsPanel } from './UserDetailsPanel';
import {useServerContext} from "../base/ServerContext";

interface UserLinkProps {
    userDisplayValue?: string;
    userId: number;
    unknown?: boolean;
}

export const UserLink: FC<UserLinkProps> = props => {
    const { userId, userDisplayValue, unknown } = props;
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [targetUserDisplayValue, setTargetUserDisplayValue] = useState<string>();
    const { user, container } = useServerContext();
    const isSelf = userId === user.id;

    useEffect(() => {
        (async () => {
            try {
                if (!!userId && userDisplayValue === undefined) {
                    const targetUser = await selectRowsUserProps(userId);
                    setTargetUserDisplayValue(caseInsensitive(targetUser, 'DisplayName'));
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

    if (targetUserDisplayValue && !userId) return <span>{targetUserDisplayValue}</span>;

    if (unknown) {
        return (
            <span className="gray-text" title="User may have been deleted from the system.">
                &lt;unknown user&gt;
            </span>
        );
    }

    if (!userId) return null;

    if (!isSelf && (!userCanReadUserDetails(user) || !targetUserDisplayValue)) {
        if (targetUserDisplayValue) return <span>{targetUserDisplayValue}</span>;
        return (
            <span className="gray-text" title="User may have been deleted from the system.">
                &lt;{userId}&gt;
            </span>
        );
    }

    return (
        <>
            <a onClick={toggleDetailsModal} style={{ cursor: 'pointer' }}>
                {targetUserDisplayValue}
            </a>
            {showDetails && (
                <UserDetailsPanel
                    container={container}
                    currentUser={user}
                    userId={userId}
                    toggleDetailsModal={toggleDetailsModal}
                    isSelf={!userCanReadUserDetails(user) && isSelf}
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
    users: UserOrGroup[];
}

export const UserLinkList: FC<UserLinkListProps> = ({ users }) => {
    return (
        <>
            {users.map((u, i) => (
                <>
                    {i > 0 && ', '}
                    {u.type === 'u' || u.type === undefined ? (
                        <UserLink key={u.id} userId={u.id} userDisplayValue={u.displayName} />
                    ) : (
                        <span>{u.displayName}</span>
                    )}
                </>
            ))}
        </>
    );
};
