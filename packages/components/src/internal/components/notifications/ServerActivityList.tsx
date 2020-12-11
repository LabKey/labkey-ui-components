import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { ServerActivity, ServerActivityData } from './model';
import { formatDateTime, getDateTimeFormat, parseDate } from '../../util/Date';

interface Props {
    serverActivity: ServerActivity;
    onViewAll: () => void;
    maxListingSize: number;
    viewAllText: string;
    noActivityMsg: string;
    viewErrorDetailsText: string;
    onRead: (id: number) => void;
}

export class ServerActivityList extends React.PureComponent<Props> {
    static defaultProps = {
        maxListingSize: 10,
        viewAllText: 'View all activity',
        noActivityMsg: 'No notifications available.',
        viewErrorDetailsText: 'View error details',
    };

    markRead = (notificationId: number): void => {
        this.props.onRead(notificationId);
    };

    showErrorDetails = (notificationId: number): void => {
        console.log('showErrorDetails ' + notificationId + ': not yet implemented');
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
                    <span className="server-notification-data" title={activity.CreatedBy}>
                        {activity.CreatedBy}
                    </span>
                )}
                <div className="pull-right server-notification-data">
                    {formatDateTime(parseDate(activity.Created, getDateTimeFormat()))}
                </div>
            </li>
        );
    }

    render(): ReactNode {
        const { serverActivity, onViewAll, maxListingSize, noActivityMsg, viewAllText } = this.props;

        if (!serverActivity || serverActivity.totalRows === 0) {
            return <div className="server-notifications-footer">{noActivityMsg}</div>;
        }

        return (
            <>
                <div className="server-notifications-listing-container">
                    <ul className="server-notifications-listing">
                        {serverActivity.data.slice(0, maxListingSize).map((data, index) => this.renderData(data, index))}
                    </ul>
                </div>
                {maxListingSize && serverActivity.totalRows > maxListingSize && (
                    <div className="server-notifications-footer server-notifications-link" onClick={onViewAll}>
                        {viewAllText}
                    </div>
                )}
            </>
        );
    }
}
