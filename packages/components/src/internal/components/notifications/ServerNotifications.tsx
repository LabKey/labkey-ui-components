import React, { ReactNode } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { markNotificationsAsRead } from './actions';
import { ServerNotificationsConfig } from './model';
import { ServerActivityList } from './ServerActivityList';

interface State {
    show: boolean;
}

export class ServerNotifications extends React.Component<ServerNotificationsConfig, State> {
    static defaultProps = {
        maxRows: 8,
    };

    constructor(props: ServerNotificationsConfig) {
        super(props);

        this.state = {
            show: false,
        };
    }

    markAllRead = (): void => {
        this.props
            .markAllNotificationsRead()
            .then(() => {
                if (this.props.onRead) this.props.onRead();
            })
            .catch(() => {
                console.error('Unable to mark all notifications as read');
            });
    };

    onRead = (id: number): void => {
        markNotificationsAsRead([id])
            .then(() => {
                if (this.props.onRead) this.props.onRead();
            })
            .catch(() => {
                console.error('Unable to mark notification ' + id + ' as read');
            });
    };

    hasAnyUnread(): boolean {
        return this.getNumUnread() > 0;
    }

    getNumUnread(): number {
        if (!this.props.serverActivity || !this.props.serverActivity.isLoaded) {
            return 0;
        }

        return this.props.serverActivity.unreadCount;
    }

    hasAnyInProgress(): boolean {
        return this.props.serverActivity?.inProgressCount > 0;
    }

    toggleMenu = (): void => {
        this.setState(state => ({ show: !state.show }));
    };

    _onViewAll = (): void => {
        this.toggleMenu();
        this.props.onViewAll();
    };

    render(): ReactNode {
        const { serverActivity, maxRows, onViewAll } = this.props;
        const { show } = this.state;

        const numUnread = this.getNumUnread();
        const title = (
            <h3 className="navbar-menu-header">
                <div className={'navbar-icon-connector' + (numUnread > 0 ? ' has-unread' : '')} />
                Notifications
                {numUnread > 0 && (
                    <div className="pull-right server-notifications-link" onClick={this.markAllRead}>
                        Mark all as read
                    </div>
                )}
            </h3>
        );
        let body;
        if (serverActivity?.isError) {
            body = (
                <div className="server-notifications-footer server-notifications-error">
                    {serverActivity.errorMessage}
                </div>
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
                    onViewAll={this._onViewAll}
                    onViewClick={this.toggleMenu}
                    onRead={this.onRead}
                />
            );
        }

        const icon = (
            <span>
                <i
                    className={
                        'fa ' + (this.hasAnyInProgress() ? 'fa-spinner fa-pulse' : 'fa-bell') + ' navbar-header-icon'
                    }
                />
                {this.hasAnyUnread() && <span className="badge">{numUnread}</span>}
            </span>
        );

        // TODO: This should not be using DropdownButton as it is not rendering any MenuItem components. We will address
        //  this in a future PR
        return (
            <DropdownButton
                id="server-notifications-button"
                className="navbar-icon-button-right server-notifications-button"
                noCaret={true}
                title={icon}
                open={show}
                onToggle={this.toggleMenu}
                pullRight={true}
            >
                {title}
                {body}
            </DropdownButton>
        );
    }
}
