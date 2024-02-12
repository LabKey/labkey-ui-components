import React, { FC, ReactNode, useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { markNotificationsAsRead } from './actions';
import { ServerNotificationsConfig } from './model';
import { ServerActivityList } from './ServerActivityList';
import { useNavMenuState } from '../../useNavMenuState';

export const ServerNotifications: FC<ServerNotificationsConfig> = props => {
    const { markAllNotificationsRead, maxRows, serverActivity } = props;
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const toggleMenu = useCallback(() => setShow(s => !s), []);

    const onRead = useCallback(
        async (id: number) => {
            try {
                await markNotificationsAsRead([id]);
                props.onRead?.();
            } catch (e) {
                console.error('Unable to mark notification ' + id + ' as read');
            }
        },
        [props.onRead]
    );

    const markAllRead = useCallback(async () => {
        try {
            await markAllNotificationsRead();
            props.onRead?.();
        } catch (e) {
            console.error('Unable to mark all notifications as read');
        }
    }, [props.onRead]);

    const unreadCount = useMemo(() => {
        if (!serverActivity || !serverActivity.isLoaded) return 0;
        return 5;
        // return serverActivity.unreadCount;
    }, [serverActivity]);
    const hasAnyInProgress = serverActivity?.inProgressCount > 0;
    const onViewAll = useCallback(() => {
        toggleMenu();
        props.onViewAll();
    }, [props.onViewAll, toggleMenu]);

    let body: ReactNode;
    if (serverActivity?.isError) {
        body = (
            <div className="server-notifications-footer server-notifications-error">{serverActivity.errorMessage}</div>
        );
    } else if (!serverActivity || !serverActivity.isLoaded) {
        body = (
            <div className="server-notifications-footer">
                <LoadingSpinner />
            </div>
        );
    } else {
        body = (
            <ServerActivityList
                maxRows={maxRows}
                serverActivity={serverActivity}
                onViewAll={onViewAll}
                onViewClick={toggleMenu}
                onRead={onRead}
            />
        );
    }
    const iconClassName = classNames('navbar-header-icon', 'fa', {
        'fa-spinner fa-pulse': hasAnyInProgress,
        'fa-bell': !hasAnyInProgress,
    });
    return (
        <div className="navbar-item pull-right server-notifications navbar-menu">
            <button type="button" className="navbar-menu-button" onClick={toggleMenu} ref={toggleRef}>
                <span className={iconClassName} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {show && (
                <div className="navbar-menu__content" ref={menuRef}>
                    <h3 className="navbar-menu-header">
                        <div className={'navbar-icon-connector' + (unreadCount > 0 ? ' has-unread' : '')} />
                        Notifications
                        {unreadCount > 0 && (
                            <div className="pull-right server-notifications-link" onClick={markAllRead}>
                                Mark all as read
                            </div>
                        )}
                    </h3>
                    {body}
                </div>
            )}
        </div>
    );
};
