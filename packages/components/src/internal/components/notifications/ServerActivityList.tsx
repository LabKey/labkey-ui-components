import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { ServerActivity, ServerActivityData } from './model';
import { formatDateTime, getDateTimeFormat, parseDate } from '../../util/Date';
import { resolveErrorMessage } from "../../..";

interface Props {
    serverActivity: ServerActivity;
    onViewAll: () => any;
    onShowErrorDetail: (notification: ServerActivityData) => any;
    maxRows: number;
    viewAllText: string;
    noActivityMsg: string;
    viewErrorDetailsText: string;
    onRead: (id: number) => void;
}

export class ServerActivityList extends React.PureComponent<Props> {
    static defaultProps = {
        maxRows: 8,
        viewAllText: 'View all activity',
        noActivityMsg: 'No notifications available.',
        viewErrorDetailsText: 'View error details',
    };

    markRead = (notificationId: number): void => {
        this.props.onRead(notificationId);
    };

    showErrorDetails = (notificationItem: ServerActivityData): void => {
        this.props.onShowErrorDetail(notificationItem);
    };

    renderNotificationContent = (content: string, isError?: boolean, isInProgress?: boolean) => {
        const newlineIndex = content.toLowerCase().indexOf("\n");
        const brIndex = content.toLowerCase().indexOf("<br>");
        let subject : string = undefined, details : string = undefined;
        if (newlineIndex > 0 || brIndex > 0) {
            if (newlineIndex > 0) {
                subject = content.substr(0, newlineIndex);
                details = content.substring(newlineIndex + 1, content.length);
            }
            else {
                subject = content.substr(0, brIndex);
                details = content.substring(brIndex + 4, content.length);
            }

            const detailsDisplay = isError ? resolveErrorMessage(details) : details;
            return (<>
                <span className={'server-notifications-item-subject'} dangerouslySetInnerHTML={{ __html: subject }} />
                {detailsDisplay && <span className={'server-notifications-item-details'} dangerouslySetInnerHTML={{ __html: detailsDisplay }} />}
            </>);
        }
        else if (isInProgress) {
            return <span className={'server-notifications-item-subject'}>{`A background import is processing: ${content}`}</span>
        }

        return <span className={'server-notifications-item-subject'} dangerouslySetInnerHTML={{ __html: content }} />;
    }

    renderData(activity: ServerActivityData, key: number): ReactNode {
        const isUnread = activity.isUnread() && !activity.inProgress;
        return (
            <li key={key} className={isUnread ? 'is-unread' : undefined} onClick={isUnread ? () => this.markRead(activity.RowId) : undefined}>
                <i
                    className={classNames('fa', {
                        'fa-spinner fa-pulse': activity.inProgress,
                        'fa-exclamation-circle has-error': activity.hasError,
                        'fa-check-circle is-complete': !activity.inProgress && !activity.hasError,
                    })}
                />
                <span className={classNames('server-notification-message', {
                        'is-unread server-notifications-item': isUnread,
                    })}
                >
                    {this.renderNotificationContent(activity.HtmlContent, activity.hasError, activity.inProgress)}
                </span>
                <br />
                {activity.hasError ? (
                    <span className="server-notifications-link" onClick={() => this.showErrorDetails(activity)}>
                        {this.props.viewErrorDetailsText}
                    </span>
                ) : (
                    <span className="server-notification-data" title={activity.CreatedBy}>
                        {activity.CreatedBy}
                    </span>
                )}
                <div className="pull-right server-notification-data">{formatDateTime(parseDate(activity.Created))}</div>
            </li>
        );
    }

    render(): ReactNode {
        const { serverActivity, onViewAll, maxRows, noActivityMsg, viewAllText } = this.props;

        if (!serverActivity || serverActivity.totalRows === 0) {
            return <div className="server-notifications-footer">{noActivityMsg}</div>;
        }

        return (
            <>
                <div className="server-notifications-listing-container">
                    <ul className="server-notifications-listing">
                        {serverActivity.data.slice(0, maxRows).map((data, index) => this.renderData(data, index))}
                    </ul>
                </div>
                {maxRows && serverActivity.totalRows > maxRows && (
                    <div className="server-notifications-footer server-notifications-link" onClick={onViewAll}>
                        {viewAllText}
                    </div>
                )}
            </>
        );
    }
}
