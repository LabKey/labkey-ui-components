import React from 'react';
import { List } from 'immutable';
import { User as IUser } from '@labkey/api';
import {User} from "../base/models/User";
import {AppURL} from "../../url/AppURL";

interface Props {
    currentUser: User;
    allUsers: List<IUser>;
    userId: string;
}

export class UserLink extends React.PureComponent<Props> {
    render() {
        const { allUsers, currentUser, userId } = this.props;
        if (!allUsers || !userId) return null;

        let targetUser: IUser = null;
        if (allUsers) {
            targetUser = allUsers.find(user => user.userId === parseInt(userId));
        }

        if (targetUser) {
            const link = AppURL.create('q', 'core', 'siteusers', userId).toHref();
            return currentUser.isAdmin ? <a href={link}>{targetUser.displayName}</a> : targetUser.displayName;
        }
        return null;
    }
}
