import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { ServerActivityData } from './model';
import { formatDateTime, getDateTimeFormat, parseDate } from '../../util/Date';

interface ServerActivityListProps {
    activityData: ServerActivityData[];
    onViewAll: () => void;
    maxListingSize: number;
    viewAllText: string;
    noActivityMsg: string;
    viewErrorDetailsText: string;
}

export class ServerActivityList extends React.PureComponent<ServerActivityListProps> {
    static defaultProps = {
        maxListingSize: 10,
        viewAllText: 'View all activity',
        noActivityMsg: 'No notifications available.',
        viewErrorDetailsText: 'View error details',
    };

    markRead = (notificationId: number): void => {
        console.log('markRead ' + notificationId + ': not yet implemented');
    };

    showErrorDetails = (notificationId: number): void => {
        console.log('showErrorDetails: not yet implemented');
    };

    renderData(activity: ServerActivityData, key: number): ReactNode {
        return (
            <li key={key}>
                <i
                    className={classNames('fa', {
                        'fa-spinner fa-pulse': activity.inProgress,
                        'fa-exclamation-circle has-error': activity.hasError,
                        'fa-check-circle is-complete': !activity.inProgress && !activity.hasError,
                    })}
                />
                {activity.ReadOn == undefined && !activity.inProgress ? (
                    <span
                        className={'server-notifications-link server-notification-message ' + (activity.ReadOn == undefined ? 'is-unread' : '')}
                        onClick={() => this.markRead(activity.RowId)}
                    >
                        {activity.HtmlContent}
                    </span>
                ) : (
                    <span className="server-notification-message">{activity.HtmlContent}</span>
                )}
                <br />
                {activity.hasError ? (
                    <span className="server-notifications-link" onClick={() => this.showErrorDetails(activity.RowId)}>
                        {this.props.viewErrorDetailsText}
                    </span>
                ) : (
                    <span className="server-notification-data">{activity.CreatedBy}</span>
                )}
                <div className="pull-right server-notification-data">{formatDateTime(parseDate(activity.Created, getDateTimeFormat()))}</div>
            </li>
        );
    }

    render(): ReactNode {
        const { activityData, onViewAll, maxListingSize, noActivityMsg, viewAllText } = this.props;

        if (!activityData || activityData.length === 0) {
            return <div>{noActivityMsg}</div>;
        }

        return (
            <div>
                <ul className="server-notifications-listing">
                    {activityData.slice(0, maxListingSize).map((data, index) => this.renderData(data, index))}
                </ul>
                {maxListingSize && activityData.length > maxListingSize && (
                    <div className="server-notifications-footer server-notifications-link" onClick={onViewAll}>
                        {viewAllText}
                    </div>
                )}
            </div>
        );
    }
}
