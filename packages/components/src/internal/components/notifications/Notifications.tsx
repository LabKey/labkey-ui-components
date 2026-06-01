/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { differenceInDays, differenceInSeconds } from 'date-fns';

import { useServerContext } from '../base/ServerContext';

import { parseDate } from '../../util/Date';

import { NotificationItemModel, Persistence } from './model';
import { setTrialBannerDismissSessionKey } from './actions';

import { NotificationItem } from './NotificationItem';
import { useNotificationsContext } from './NotificationsContext';

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
NotificationList.displayName = 'NotificationList';

export const Notifications: FC = () => {
    const { notifications, dismissNotifications, createNotification } = useNotificationsContext();
    const { moduleContext, user } = useServerContext();
    const renderTrialServicesNotification = useCallback(() => {
        const { trialEndDate, upgradeLink, upgradeLinkText } = moduleContext.trialservices;
        const endDate = parseDate(trialEndDate);
        const today = new Date();
        const secondsLeft = differenceInSeconds(endDate, today) % 86_400;
        // seems a little silly, but if we have any time left in the current day, we count it as a day
        const dayDiff = differenceInDays(endDate, today) + (secondsLeft > 0 ? 1 : 0);
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
Notifications.displayName = 'Notifications';
