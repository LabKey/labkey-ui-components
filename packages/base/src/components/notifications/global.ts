/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getGlobal, setGlobal } from 'reactn'
import { Map } from 'immutable'

import { NotificationItemModel, Persistence } from './model'


/**
 * Initialize the global state object for this package.
 */
export function initNotificationsState() {
    if (!getGlobal().Notifications) {
        resetNotificationsState()
    }

}

/**
 * Clear out all of the notifications, leaving an empty map
 */
export function resetNotificationsState() {
    setGlobal({
        // map between ids and notifications.
        Notifications: Map<string, NotificationItemModel>()
    })
}

export function getNotifications() : Map<string, NotificationItemModel> {
    if (!getGlobal()['Notifications']) {
        throw new Error('Must call initNotificationsState before you can access anything from the global.Notifications objects.');
    }
    return getGlobal()['Notifications']
}

/**
 * Add a notification for the given item.  If a notification with the same id already exists,
 * there will be no changes in the global state.
 * @param item
 */
export function addNotification(item: NotificationItemModel) {
    const current = getNotifications();
    if (current.has(item.id))
        return current;
    const updated = current.set(item.id, item);
    setGlobal( {
        Notifications: updated
    });
    return updated;
}

/**
 * Update a notification item identified by the given id.  If no updates are provided,
 * no change in global state is made.
 * @param id
 * @param updates
 * @param failIfNotFound
 */
export function updateNotification(id: string, updates: any, failIfNotFound: boolean = true) {
    let state = getNotifications();
    if (!updates)
        return state;
    if (failIfNotFound && !state.has(id)) {
        throw new Error("Unable to find NotificationItem for id " + id);
    }
    let currentNotification = state.get(id);
    if (currentNotification) {
        state = state.set(id, currentNotification.merge(updates) as NotificationItemModel);
        setGlobal( {
            Notifications: state
        });
    }
    return state;
}

/**
 * Dismiss the notifications identified by the given id or the given persistence level.
 * If neither parameter is provided, dismisses the notifications with Persistence.PAGE_LOAD.
 * @param id Optional string identifier for a notification
 * @param persistence Optional Persistence value used to select notifications
 */
export function dismissNotifications(id?: string, persistence?: Persistence) {
    let state = getNotifications();
    persistence = persistence || Persistence.PAGE_LOAD;
    if (id) {
        let notification = state.get(id);
        if (notification.onDismiss)
            notification.onDismiss();
        return updateNotification(id, {'isDismissed': true});
    } else  {

        let dismissed = state
            .filter((item) => item.persistence == persistence);

        dismissed.forEach((item) => {
            if (item.onDismiss)
                item.onDismiss();
            state = updateNotification(item.id, {'isDismissed': true});
        });
        return state;
    }

}