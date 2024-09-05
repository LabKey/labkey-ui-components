import React, { FC, ReactNode, useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { useNavMenuState } from '../../useNavMenuState';

import { markNotificationsAsRead } from './actions';
import { ServerNotificationsConfig } from './model';
import { ServerActivityList } from './ServerActivityList';

export const ServerNotifications: FC<ServerNotificationsConfig> = props => {
    const { markAllNotificationsRead, maxRows, onRead, serverActivity } = props;
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const toggleMenu = useCallback(() => setShow(s => !s), [setShow]);

    const onRead_ = useCallback(
        async (id: number) => {
            try {
                await markNotificationsAsRead([id]);
                onRead?.();
            } catch (e) {
                console.error('Unable to mark notification ' + id + ' as read');
            }
        },
        [props.onRead]
    );

    const markAllRead = useCallback(async () => {
        try {
            await markAllNotificationsRead();
            onRead?.();
        } catch (e) {
            console.error('Unable to mark all notifications as read');
        }
    }, [markAllNotificationsRead, props]);

    const unreadCount = useMemo(() => {
        if (!serverActivity || !serverActivity.isLoaded) return 0;
        return serverActivity.unreadCount;
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
                onRead={onRead_}
            />
        );
    }
    const iconClassName = classNames('navbar-header-icon', 'fa', {
        'fa-spinner fa-pulse': hasAnyInProgress,
        'fa-bell': !hasAnyInProgress,
    });
    return (
        <div className="navbar-item pull-right server-notifications navbar-menu">
            <button
                aria-haspopup="true"
                aria-expanded={show}
                className="navbar-menu-button"
                onClick={toggleMenu}
                ref={toggleRef}
                role="button"
                type="button"
            >
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
