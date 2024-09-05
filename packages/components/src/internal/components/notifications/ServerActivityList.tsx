import React, { ReactNode } from 'react';
import { Map } from 'immutable';
import classNames from 'classnames';

import { formatDateTime, parseDate } from '../../util/Date';
import { resolveErrorMessage } from '../../util/messaging';
import { capitalizeFirstChar } from '../../util/utils';

import { PIPELINE_MAPPER } from '../../url/URLResolver';
import { AppURL } from '../../url/AppURL';

import { ServerActivity, ServerActivityData } from './model';

interface Props {
    actionLinkLabel: string;
    maxRows: number;
    noActivityMsg: string;
    onRead: (id: number) => void;
    onViewAll: () => void;
    onViewClick: () => void;
    serverActivity: ServerActivity;
    viewAllText: string;
}

export class ServerActivityList extends React.PureComponent<Props> {
    static defaultProps = {
        maxRows: 8,
        viewAllText: 'View all activity',
        noActivityMsg: 'No notifications available.',
        actionLinkLabel: 'View details',
    };

    markRead = (notificationId: number): void => {
        this.props.onRead(notificationId);
    };

    renderNotificationContent = (content: string, isHtml?: boolean, isError?: boolean, isInProgress?: boolean) => {
        const newlineIndex = content.toLowerCase().indexOf('\n');
        const brIndex = content.toLowerCase().indexOf('<br>');
        let subject: string, details: string;
        if (newlineIndex > 0 || brIndex > 0) {
            if (newlineIndex > 0) {
                subject = content.substr(0, newlineIndex);
                details = content.substring(newlineIndex + 1, content.length);
            } else {
                subject = content.substr(0, brIndex);
                details = content.substring(brIndex + 4, content.length);
            }

            const detailsDisplay = isError ? resolveErrorMessage(details) : details;
            return (
                <>
                    {this.renderContent(subject, 'server-notifications-item-subject', isHtml)}
                    {detailsDisplay && (
                        <>
                            <br />
                            {this.renderContent(detailsDisplay, 'server-notifications-item-details', isHtml)}
                        </>
                    )}
                </>
            );
        } else if (isInProgress) {
            return this.renderContent(
                `A background import is processing: ${content}`,
                'server-notifications-item-subject',
                isHtml
            );
        }

        return this.renderContent(content, 'server-notifications-item-subject', isHtml);
    };

    renderContent = (content: string, clsName: string, isHtml: boolean) => {
        if (isHtml) return <span className={clsName} dangerouslySetInnerHTML={{ __html: content }} />;

        return <span className={clsName}>{content}</span>;
    };

    renderData(activity: ServerActivityData, key: number): ReactNode {
        const { actionLinkLabel, onViewClick } = this.props;
        const isUnread = activity.isUnread() && !activity.inProgress;
        const resolvedUrl = PIPELINE_MAPPER.resolve(
            activity.ActionLinkUrl,
            Map({ rowId: activity.RowId, url: activity.ActionLinkUrl }),
            undefined,
            undefined,
            undefined
        );

        return (
            <li
                key={key}
                className={isUnread ? 'is-unread' : undefined}
                onClick={isUnread ? () => this.markRead(activity.RowId) : undefined}
            >
                <i
                    className={classNames('fa', {
                        'fa-spinner fa-pulse': activity.inProgress,
                        'fa-exclamation-circle has-error': activity.hasError,
                        'fa-check-circle is-complete': !activity.inProgress && !activity.hasError,
                    })}
                />
                <span
                    className={classNames('server-notification-message', {
                        'is-unread server-notifications-item': isUnread,
                    })}
                >
                    {this.renderNotificationContent(
                        activity.Content,
                        activity.isHTML(),
                        activity.hasError,
                        activity.inProgress
                    )}
                </span>
                <br />
                {activity.ActionLinkUrl ? (
                    <span className="server-notifications-link">
                        <a
                            href={resolvedUrl instanceof AppURL ? resolvedUrl.toHref() : activity.ActionLinkUrl}
                            onClick={onViewClick}
                        >
                            {capitalizeFirstChar(activity.ActionLinkText ? activity.ActionLinkText : actionLinkLabel)}
                        </a>
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
                <div className="server-notifications-footer server-notifications-link" onClick={onViewAll}>
                    {viewAllText}
                </div>
            </>
        );
    }
}
