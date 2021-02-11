import React, { ReactNode } from 'react';
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

export class UserDetailHeader extends React.Component<HeaderProps> {
    render() {
        const { user, userProperties, title, dateFormat, renderButtons, description } = this.props;
        const lastLogin = getUserLastLogin(userProperties, dateFormat);

        return (
            <PageDetailHeader
                user={user}
                iconUrl={user.avatar}
                title={title}
                description={description || getUserPermissionsDisplay(user).join(', ')}
                leftColumns={10}
            >
                {lastLogin && <div className="detail__header--desc">Last Login: {lastLogin}</div>}
                {renderButtons && <div className={lastLogin ? 'detail__header--buttons' : ''}>{renderButtons}</div>}
            </PageDetailHeader>
        );
    }
}
