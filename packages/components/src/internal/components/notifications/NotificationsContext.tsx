import React, { ComponentType, createContext, FC, memo, useCallback, useContext, useMemo, useState } from 'react';
import { Map } from 'immutable';
import { Utils } from '@labkey/api';

import { App } from '../../..';

import { NotificationCreatable, NotificationItemModel, NotificationItemProps, Persistence } from './model';

export interface NotificationsContextProps {
    createNotification: (creatable: NotificationCreatable, withTimeout?: boolean, callback?: () => void) => void;
    dismissNotifications: (id?: string, persistence?: Persistence) => void;
}

export interface NotificationsContextState extends NotificationsContextProps {
    notifications: Map<string, NotificationItemModel>;
    resetNotifications: () => void;
    updateNotification: (id: string, updates: any, failIfNotFound?: boolean) => void;
}

export const NotificationsContext = createContext<NotificationsContextState>(undefined);

export const useNotificationsContext = (): NotificationsContextState => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotificationsContext must be used within a NotificationsContext.Provider');
    }
    return context;
};

export interface NotificationsContextProviderProps {
    initialContext?: NotificationsContextState;
}

export const NotificationsContextProvider: FC<NotificationsContextProviderProps> = memo(({ children, initialContext }) => {
    const [notifications, setNotifications] = useState<Map<string, NotificationItemModel>>(
        initialContext?.notifications ?? Map<string, NotificationItemModel>()
    );

    /**
     * Clear out all of the notifications, leaving an empty map.
     */
    const resetNotifications = useCallback(() => {
        setNotifications(Map<string, NotificationItemModel>());
    }, []);

    /**
     * Update a notification item identified by the given id.  If no updates are provided,
     * no change is made.
     * @param id
     * @param updates
     * @param failIfNotFound
     */
    const updateNotification = useCallback((id: string, updates: any, failIfNotFound = true) => {
        if (!updates) return;
        if (failIfNotFound && !notifications.has(id)) {
            throw new Error('Unable to find NotificationItem for id ' + id);
        }
        const currentNotification = notifications.get(id);
        if (currentNotification) {
            setNotifications(current => {
                return current.set(id, currentNotification.merge(updates) as NotificationItemModel);
            });
        }
    }, [notifications]);

    /**
     * Dismiss the notifications identified by the given id or the given persistence level.
     * If neither parameter is provided, dismisses the notifications with Persistence.PAGE_LOAD.
     * @param id Optional string identifier for a notification
     * @param persistence Optional Persistence value used to select notifications
     */
    const dismissNotifications = useCallback(
        (id?: string, persistence?: Persistence) => {
            persistence = persistence || Persistence.PAGE_LOAD;
            if (id) {
                const notification = notifications.get(id);
                if (notification.onDismiss) notification.onDismiss();
                updateNotification(id, { isDismissed: true });
            } else {
                const dismissed = notifications.filter(item => item.persistence == persistence);

                dismissed.forEach(item => {
                    if (item.onDismiss) item.onDismiss();
                    updateNotification(item.id, { isDismissed: true });
                });
            }
        },
        [notifications, updateNotification]
    );

    /**
     * Create a notification that can be displayed on pages within the application
     * @param creatable
     */
    const createNotification = useCallback((creatable: NotificationCreatable, withTimeout = false, callback?: any) => {
        if (callback) window.setTimeout(callback, App.NOTIFICATION_TIMEOUT);
        if (withTimeout) {
            window.setTimeout(() => createNotification(creatable), App.NOTIFICATION_TIMEOUT);
            return;
        }

        let item: NotificationItemModel;
        if (Utils.isString(creatable)) {
            item = NotificationItemModel.create({
                message: creatable,
            });
        } else if (!(creatable instanceof NotificationItemModel)) {
            item = NotificationItemModel.create(creatable as NotificationItemProps);
        } else item = creatable;

        if (item) {
            setNotifications(current => {
                if (current.has(item.id)) return;
                return current.set(item.id, item);
            });
        }
    }, []);

    const notificationsContext = useMemo<NotificationsContextState>(
        () => ({ notifications, resetNotifications, createNotification, updateNotification, dismissNotifications }),
        [createNotification, dismissNotifications, notifications, resetNotifications, updateNotification]
    );

    return <NotificationsContext.Provider value={notificationsContext}>{children}</NotificationsContext.Provider>;
});

export function withNotificationsContext<T>(Component: ComponentType<T & NotificationsContextProps>): ComponentType<T> {
    const wrapped: FC<T> = props => {
        const { createNotification, dismissNotifications } = useNotificationsContext();
        return (
            <Component createNotification={createNotification} dismissNotifications={dismissNotifications} {...props} />
        );
    };

    return wrapped;
}
