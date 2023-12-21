import React, { ComponentType, createContext, FC, memo, useCallback, useContext, useMemo, useState } from 'react';
import { Map } from 'immutable';
import { Utils } from '@labkey/api';

import { NOTIFICATION_TIMEOUT } from '../../app/constants';

import { NotificationCreatable, NotificationItemModel, NotificationItemProps, Persistence } from './model';

export interface NotificationsContextProps {
    createNotification: (creatable: NotificationCreatable, withTimeout?: boolean, callback?: () => void) => void;
    dismissNotifications: (id?: string, persistence?: Persistence) => void;
}

export interface NotificationsContextState extends NotificationsContextProps {
    notifications: Map<string, NotificationItemModel>;
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

// TODO: move implementation to GlobalStateContextProvider
export const NotificationsContextProvider: FC<NotificationsContextProviderProps> = memo(
    ({ children, initialContext }) => {
        const [notifications, setNotifications] = useState<Map<string, NotificationItemModel>>(
            initialContext?.notifications ?? Map<string, NotificationItemModel>()
        );

        /**
         * Dismiss the notifications identified by the given id or the given persistence level.
         * If neither parameter is provided, dismisses the notifications with Persistence.PAGE_LOAD.
         * @param id Optional string identifier for a notification
         * @param persistence Optional Persistence value used to select notifications
         */
        const dismissNotifications = useCallback((id?: string, persistence?: Persistence) => {
            persistence = persistence || Persistence.PAGE_LOAD;
            if (id) {
                setNotifications(current => {
                    const currentNotification = current.get(id);
                    if (currentNotification) {
                        currentNotification.onDismiss?.();
                        return current.set(
                            id,
                            currentNotification.merge({ isDismissed: true }) as NotificationItemModel
                        );
                    }
                    return current;
                });
            } else {
                setNotifications(current => {
                    let updated = current;
                    const dismissed = current.filter(item => item.persistence == persistence);
                    dismissed.forEach(item => {
                        item.onDismiss?.();
                        updated = updated.set(item.id, item.merge({ isDismissed: true }) as NotificationItemModel);
                    });
                    return updated;
                });
            }
        }, []);

        /**
         * Create a notification that can be displayed on pages within the application
         * @param creatable
         */
        const createNotification = useCallback(
            (creatable: NotificationCreatable, withTimeout = false, callback?: any) => {
                if (callback) window.setTimeout(callback, NOTIFICATION_TIMEOUT);
                if (withTimeout) {
                    window.setTimeout(() => createNotification(creatable), NOTIFICATION_TIMEOUT);
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
                        if (current.has(item.id)) return current;
                        return current.set(item.id, item);
                    });
                }
            },
            []
        );

        const notificationsContext = useMemo<NotificationsContextState>(
            () => ({ notifications, createNotification, dismissNotifications }),
            [notifications, createNotification, dismissNotifications]
        );

        return <NotificationsContext.Provider value={notificationsContext}>{children}</NotificationsContext.Provider>;
    }
);

/**
 * @deprecated use the useNotificationsContext hook instead
 * @param Component: the component to wrap and inject the NotificationsContext methods into
 */
export function withNotificationsContext<T>(Component: ComponentType<T & NotificationsContextProps>): ComponentType<T> {
    const wrapped: FC<T> = props => {
        const { createNotification, dismissNotifications } = useNotificationsContext();
        return (
            <Component createNotification={createNotification} dismissNotifications={dismissNotifications} {...props} />
        );
    };

    return wrapped;
}
