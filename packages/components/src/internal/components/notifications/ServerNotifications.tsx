import React, { ReactNode } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { getPipelineActivityData, markAllNotificationsAsRead, markNotificationsAsRead } from './actions';
import { ServerActivity } from './model';
import { ServerActivityList } from './ServerActivityList';
import { LoadingSpinner } from '../../../index';

interface Props {
    maxListingSize?: number;
}

interface State {
    serverActivity: ServerActivity;
    isLoading: boolean;
    error: string;
    show: boolean;
}

export class ServerNotifications extends React.Component<Props, State> {
    static defaultProps = {
        maxListingSize: 8,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            serverActivity: undefined,
            // activityData: undefined,
            // totalRows: undefined,
            isLoading: true,
            error: undefined,
            show: false,
        };
    }

    componentDidMount(): void {
        getPipelineActivityData(this.props.maxListingSize)
            .then(response => {
                this.setState(() => ({ serverActivity: response, isLoading: false }));
            })
            .catch(reason => {
                this.setState(() => ({ error: reason, isLoading: false }));
            });
    }

    markAllRead = (): void => {
        const { data } = this.state.serverActivity;
        const notificationIds = [];
        const now = new Date().toTimeString();
        const updatedData = [];
        data.forEach(activity => {
            if (activity.RowId) {
                notificationIds.push(activity.RowId);
                updatedData.push(activity.mutate({ ReadOn: now }));
            } else {
                updatedData.push(activity);
            }
        });
        markAllNotificationsAsRead()
            .then(() => {
                this.setState(state => (
                    { serverActivity: Object.assign({}, state.serverActivity, { data: updatedData, unreadCount: 0 })}
                ));
            })
            .catch(() => {
                    console.error('Unable to mark all notifications as read');
            });
    };

    onRead = (id: number): void => {
        markNotificationsAsRead([id])
            .then(() => {
                this.setState(state => {
                    const dataIndex = state.serverActivity.data.findIndex(d => d.RowId === id);
                    if (dataIndex >= 0) {
                        const update = state.serverActivity.data[dataIndex].mutate({
                            ReadOn: new Date().toTimeString(),
                        });
                        const updatedActivity = state.serverActivity.data;
                        updatedActivity[dataIndex] = update;
                        return {
                            serverActivity: Object.assign({}, state.serverActivity, { data: updatedActivity, unreadCount: state.serverActivity.unreadCount-1 })
                        };
                    }
                    return { serverActivity: state.serverActivity };
                });
            })
            .catch(() => {
                console.error('Unable to mark notification ' + id + ' as read');
            });
    };

    viewAll = (): void => {
        console.log("viewAll: not yet implemented");
    };

    hasAnyUnread(): boolean {
        return this.getNumUnread() > 0;
    }

    getNumUnread(): number {
        if (!this.state.serverActivity || this.state.isLoading) {
            return 0;
        }

        return this.state.serverActivity?.unreadCount;
    }

    hasAnyInProgress(): boolean {
        return this.state.serverActivity?.inProgressCount > 0;
    }

    toggleMenu = (): void => {
        this.setState(state => ({ show: !state.show }));
    };

    render(): ReactNode {
        const { serverActivity, error, isLoading, show } = this.state;
        const numUnread = this.getNumUnread();
        const title = (
            <h3 className="server-notifications-header">
                <div className="navbar-icon-connector" />
                Notifications
                {numUnread > 0 && (
                    <div className="pull-right server-notifications-link" onClick={this.markAllRead}>
                        Mark all as read
                    </div>
                )}
            </h3>
        );
        let body;
        if (isLoading) {
            body = <div className="server-notifications-footer"><LoadingSpinner /></div>;
        } else if (error) {
            body = <div className="server-notifications-footer server-notifications-error">{error}</div>;
        } else {
            body = (
                <ServerActivityList
                    maxListingSize={this.props.maxListingSize}
                    serverActivity={serverActivity}
                    onViewAll={this.viewAll}
                    onRead={this.onRead}
                />
            );
        }

        const icon = (
            <span className="fa-stack navbar-icon" data-count={numUnread || undefined}>
                <i className="fa fa-circle fa-stack-1x" />
                <i className={
                        'fa ' +
                        (this.hasAnyInProgress() ? 'fa-spinner fa-pulse' : 'fa-bell') +
                        ' fa-stack-1x server-notifications-icon'
                    }
                />
            </span>
        );
        return (
            <DropdownButton
                id="server-notifications-button"
                className="navbar-icon-button-right"
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
