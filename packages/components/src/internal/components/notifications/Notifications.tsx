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
import { Map } from 'immutable';
import React, { FC, ReactNode, useCallback, useEffect, useMemo } from 'react';
import ReactN from 'reactn';
import moment from 'moment';

import { getDateFormat, useServerContext } from '../../..';

import { GlobalAppState } from '../../global';

import { NotificationItemModel, Persistence } from './model';
import { createNotification, setTrialBannerDismissSessionKey } from './actions';

import { NotificationItem } from './NotificationItem';

import { dismissNotifications } from './global';

interface NotificationListProps {
    alertClass: string;
    notifications: NotificationItemModel[];
}

const NotificationList: FC<NotificationListProps> = ({ alertClass, notifications }) => {
    let body;

    if (notifications.length > 1) {
        body = (
            <ul>
                {notifications.map(model => (
                    <li key={model.id}>
                        <NotificationItem item={model} />
                    </li>
                ))}
            </ul>
        );
    } else {
        body = <NotificationItem item={notifications[0]} />;
    }

    return <div className={'notification-container alert alert-' + alertClass}>{body}</div>;
};

interface NotificationProps {
    notifications: Map<string, NotificationItemModel>;
}

const NotificationsImpl: FC<NotificationProps> = ({ notifications }) => {
    const { moduleContext, user } = useServerContext();
    const renderTrialServicesNotification = useCallback(() => {
        const { trialEndDate, upgradeLink, upgradeLinkText } = moduleContext.trialservices;
        const endDate = moment(trialEndDate, getDateFormat());
        const today = moment();
        const secondsLeft = endDate.diff(today, 'seconds') % 86400;
        // seems a little silly, but if we have any time left in the current day, we count it as a day
        const dayDiff = endDate.diff(today, 'days') + (secondsLeft > 0 ? 1 : 0);
        let message = 'This LabKey trial site has expired.';

        if (dayDiff > 0) {
            message = 'This LabKey trial site will expire in ' + dayDiff + (dayDiff === 1 ? ' day.' : ' days.');
        }

        if (upgradeLink && user.isAdmin) {
            return (
                <span>
                    {message}
                    &nbsp;
                    <a href={upgradeLink} target="_blank" rel="noopener noreferrer">
                        {upgradeLinkText}
                    </a>
                </span>
            );
        }

        return message;
    }, [moduleContext, user]);

    useEffect(() => {
        if (moduleContext?.trialservices?.trialEndDate) {
            createNotification({
                alertClass: 'warning',
                id: 'trial_ending',
                message: renderTrialServicesNotification,
                onDismiss: setTrialBannerDismissSessionKey,
                persistence: Persistence.LOGIN_SESSION,
            });
        }
        return () => {
            dismissNotifications();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const byType = useMemo(() => {
        return notifications
            .filter(model => !model.isDismissed)
            .reduce((result, model) => {
                const { alertClass } = model;
                result[alertClass] = (result[alertClass] ?? []).concat(model);
                return result;
            }, {});
    }, [notifications]);

    return (
        <div className="notifications-container">
            {Object.keys(byType).map(alertClass => (
                <NotificationList key={alertClass} alertClass={alertClass} notifications={byType[alertClass]} />
            ))}
        </div>
    );
};

// In the future when we get rid of ReactN we'll probably store Notifications in a context, so we'll remove this
// component and add something like const { notifications } = useNotificationsContext() in NotificationsImpl above.
export class Notifications extends ReactN.Component<{}, {}, GlobalAppState> {
    render(): ReactNode {
        return <NotificationsImpl notifications={this.global.Notifications} />;
    }
}
