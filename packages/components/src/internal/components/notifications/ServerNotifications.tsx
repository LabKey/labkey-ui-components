/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { useNavMenuState } from '../../useNavMenuState';

import { markAllNotificationsAsRead, markNotificationsAsRead } from './actions';
import { ServerNotificationsConfig } from './model';
import { ServerActivityList } from './ServerActivityList';
import { Icon } from '../../Icon';

export const ServerNotifications: FC<ServerNotificationsConfig> = props => {
    const { onRead, serverActivity } = props;
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const toggleMenu = useCallback(() => setShow(s => !s), [setShow]);

    const onRead_ = useCallback(
        async (id: number) => {
            try {
                await markNotificationsAsRead([id]);
                onRead();
            } catch (e) {
                console.error('Unable to mark notification ' + id + ' as read');
            }
        },
        [onRead]
    );

    const markAllRead = useCallback(async () => {
        try {
            await markAllNotificationsAsRead(['Pipeline']);
            onRead();
        } catch (e) {
            console.error('Unable to mark all notifications as read');
        }
    }, [onRead]);

    const unreadCount = useMemo(() => {
        if (!serverActivity || !serverActivity.isLoaded) return 0;
        return serverActivity.unreadCount;
    }, [serverActivity]);
    const hasAnyInProgress = serverActivity?.inProgressCount > 0;

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
                serverActivity={serverActivity}
                onViewAll={toggleMenu}
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
                <Icon iconClass={iconClassName} srText="Notifications" />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {show && (
                <div className="navbar-menu__content" ref={menuRef}>
                    <h3 className="navbar-menu-header">
                        <div className={'navbar-icon-connector' + (unreadCount > 0 ? ' has-unread' : '')} />
                        Notifications
                        {unreadCount > 0 && (
                            <div className="pull-right clickable-text" onClick={markAllRead}>
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
ServerNotifications.displayName = 'ServerNotifications';
