import React, { FC, useCallback, useState, useEffect } from 'react';

import { User } from '../base/models/User';
import { userCanReadUserDetails } from '../../app/utils';

import { caseInsensitive } from '../../util/utils';

import { selectRowsUserProps, UserDetailsPanel } from './UserDetailsPanel';

interface Props {
    currentUser: User;
    userDisplayValue?: string;
    userId: number;
}

export const UserLink: FC<Props> = props => {
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
                console.log(error);
            }
        })();
    }, [userDisplayValue, userId]);

    const toggleDetailsModal = useCallback(() => {
        setShowDetails(current => !current);
    }, []);

    if (!userId) return null;

    if (!isSelf && (!userCanReadUserDetails(currentUser) || !targetUserDisplayValue)) {
        return <div>{targetUserDisplayValue ?? userId}</div>;
    }

    return (
        <>
            <a onClick={toggleDetailsModal} style={{ cursor: 'pointer' }}>
                {targetUserDisplayValue}
            </a>
            {showDetails && <UserDetailsPanel userId={userId} toggleDetailsModal={toggleDetailsModal} isSelf={!userCanReadUserDetails(currentUser) && isSelf} />}
        </>
    );
};
