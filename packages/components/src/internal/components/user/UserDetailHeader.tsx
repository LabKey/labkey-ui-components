import React, { FC, ReactNode, useMemo } from 'react';
import { Map } from 'immutable';

import { PageDetailHeader, User } from '../../..';

import { getUserLastLogin, getUserPermissionsDisplay } from './actions';

interface HeaderProps {
    dateFormat: string;
    description?: string;
    renderButtons?: ReactNode;
    title: string;
    user: User;
    userProperties: Map<string, any>;
}

export const UserDetailHeader: FC<HeaderProps> = props => {
    const { user, userProperties, title, dateFormat, renderButtons, description } = props;
    const lastLogin = useMemo(() => getUserLastLogin(userProperties, dateFormat), [dateFormat, userProperties]);
    const userDescription = useMemo(() => {
        return description || getUserPermissionsDisplay(user).join(', ');
    }, [description, user]);

    return (
        <PageDetailHeader
            user={user}
            iconUrl={user.avatar}
            title={title}
            description={userDescription}
            leftColumns={10}
        >
            {lastLogin && <div className="detail__header--desc">Last Login: {lastLogin}</div>}
            {renderButtons && <div className={lastLogin ? 'detail__header--buttons' : ''}>{renderButtons}</div>}
        </PageDetailHeader>
    );
};
