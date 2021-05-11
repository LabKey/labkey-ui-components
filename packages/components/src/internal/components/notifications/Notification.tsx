/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import ReactN from 'reactn';
import { List, Map } from 'immutable';
import moment from 'moment';
import { getServerContext } from '@labkey/api';

import { User, getDateFormat } from '../../..';

import { GlobalAppState } from '../../global';

import { NotificationItemModel, NotificationItemProps, Persistence } from './model';
import { createNotification, setTrialBannerDismissSessionKey } from './actions';

import { NotificationItem } from './NotificationItem';

import { dismissNotifications } from './global';

interface NotificationProps {
    notificationHeader?: string;
    user?: User;
}

export class Notification extends ReactN.Component<NotificationProps, any, GlobalAppState> {
    UNSAFE_componentWillMount(): void {
        this.createSystemNotification();
    }

    componentWillUnmount() {
        dismissNotifications();
    }

    renderTrialServicesNotification(props: NotificationItemProps, user: User) {
        if (getServerContext().moduleContext.trialservices.trialEndDate) {
            const endDate = moment(getServerContext().moduleContext.trialservices.trialEndDate, getDateFormat());
            const today = moment();
            const secondsDiff = endDate.diff(today, 'seconds');
            let dayDiff = endDate.diff(today, 'days');
            // seems a little silly, but if we have any time left in the current day, we count it as a day
            if (secondsDiff % 86400 > 0) dayDiff++;
            let message = '';
            if (dayDiff <= 0) message = 'This LabKey trial site has expired.';
            else message = 'This LabKey trial site will expire in ' + dayDiff + (dayDiff === 1 ? ' day.' : ' days.');
            if (getServerContext().moduleContext.trialservices.upgradeLink && user && user.isAdmin)
                return (
                    <span>
                        {message}
                        &nbsp;
                        <a href={getServerContext().moduleContext.trialservices.upgradeLink} target="_blank">
                            {getServerContext().moduleContext.trialservices.upgradeLinkText}
                        </a>
                    </span>
                );
            else return message;
        }
        return null;
    }

    createSystemNotification(): void {
        if (getServerContext().moduleContext?.trialservices?.trialEndDate) {
            createNotification({
                alertClass: 'warning',
                id: 'trial_ending',
                message: this.renderTrialServicesNotification,
                onDismiss: setTrialBannerDismissSessionKey,
                persistence: Persistence.LOGIN_SESSION,
            });
        }
    }

    renderItems(notifications: List<NotificationItemModel>, user: User) {
        if (notifications.size > 1) {
            return (
                <ul>
                    {notifications.map((item, index) => (
                        <li key={index}>
                            <NotificationItem item={item} user={user} />
                        </li>
                    ))}
                </ul>
            );
        }

        return notifications.map((item, index) => <NotificationItem item={item} key={index} user={user} />);
    }

    getNotifications(): Map<string, NotificationItemModel> {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.Notifications;
    }

    getAlertClassLists(): Map<string, List<NotificationItemModel>> {
        let listMap = Map<string, List<NotificationItemModel>>();
        const notifications = this.getNotifications();
        if (notifications) {
            notifications.forEach(item => {
                if (!item.isDismissed) {
                    if (!listMap.get(item.alertClass)) {
                        listMap = listMap.set(item.alertClass, List<NotificationItemModel>().asMutable());
                    }
                    listMap.get(item.alertClass).push(item);
                }
            });
        }
        return listMap.asImmutable();
    }

    render() {
        const { notificationHeader, user } = this.props;

        return this.getAlertClassLists()
            .filter(list => list.size > 0)
            .map((list, alertClass) => (
                <div className={'notification-container alert alert-' + alertClass} key={alertClass}>
                    {notificationHeader}
                    {this.renderItems(list, user)}
                </div>
            ))
            .toArray();
    }
}
