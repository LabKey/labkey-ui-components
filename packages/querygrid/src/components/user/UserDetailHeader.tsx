import * as React from 'react'
import { Map } from 'immutable'
import { User } from "@glass/base";
import { getUserLastLogin, getUserPermissionsDisplay } from "./actions";
import { PageDetailHeader } from "../forms/PageDetailHeader";

interface HeaderProps {
    title: string
    user: User
    userProperties: Map<string, any>
    dateFormat: string
}

export class UserDetailHeader extends React.Component<HeaderProps> {

    render() {
        const { user, userProperties, title, dateFormat } = this.props;
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
            </PageDetailHeader>
        )
    }
}