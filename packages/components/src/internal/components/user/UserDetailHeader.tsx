import React from 'react';
import { Map } from 'immutable';

import { PageDetailHeader } from '../forms/PageDetailHeader';
import { User } from '../base/models/model';

import { getUserLastLogin, getUserPermissionsDisplay } from './actions';

interface HeaderProps {
    title: string;
    user: User;
    userProperties: Map<string, any>;
    dateFormat: string;
    renderButtons?: () => any;
    description?: string;
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
                {renderButtons && <div className={lastLogin ? 'detail__header--buttons' : ''}>{renderButtons()}</div>}
            </PageDetailHeader>
        );
    }
}
