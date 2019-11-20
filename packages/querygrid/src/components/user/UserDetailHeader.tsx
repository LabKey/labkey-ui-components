import * as React from 'react'
import { Map } from 'immutable'
import { getUserLastLogin, getUserPermissionsDisplay } from "./actions";
import { PageDetailHeader } from "../forms/PageDetailHeader";
import { User } from '../base/models/model';

interface HeaderProps {
    title: string
    user: User
    userProperties: Map<string, any>
    dateFormat: string
    renderButtons?: () => any
}

export class UserDetailHeader extends React.Component<HeaderProps> {

    render() {
        const { user, userProperties, title, dateFormat, renderButtons } = this.props;
        const lastLogin = getUserLastLogin(userProperties, dateFormat);

        return (
            <PageDetailHeader
                user={user}
                iconUrl={user.avatar}
                title={title}
                description={getUserPermissionsDisplay(user).join(', ')}
                leftColumns={10}
            >
                {lastLogin && <div className={'detail__header--desc'}>Last Login: {lastLogin}</div>}
                {renderButtons && <div className={lastLogin ? 'detail__header--buttons' : ''}>{renderButtons()}</div>}
            </PageDetailHeader>
        )
    }
}