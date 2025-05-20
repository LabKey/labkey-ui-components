import React, { FC, memo, ReactNode, useCallback } from 'react';
import { Map } from 'immutable';
import classNames from 'classnames';

import { ActionURL } from '@labkey/api';

import { formatDateTime, parseDate } from '../../util/Date';
import { resolveErrorMessage } from '../../util/messaging';
import { capitalizeFirstChar } from '../../util/utils';

import { PIPELINE_MAPPER } from '../../url/URLResolver';
import { AppURL } from '../../url/AppURL';

import { AppLink } from '../../url/AppLink';

import { SERVER_NOTIFICATION_MAX_ROWS } from '../../app/constants';

import { ServerActivity, ServerActivityData } from './model';

const defaultActionLinkText = 'View details';

function resolveActionLinkUrl(url: string, rowId: number): string | AppURL {
    if (!url) return undefined;
    const resolvedUrl = PIPELINE_MAPPER.resolve(url, Map({ rowId, url }), undefined, undefined, undefined);

    if (resolvedUrl instanceof AppURL) return resolvedUrl;

    const currentAction = ActionURL.getAction();

    // convert app.view URLs to appDev.view URLs when in dev mod
    if (currentAction.toLowerCase() === 'appdev') url = url.replace('app.view', `${currentAction}.view`);

    return url;
}

interface ContentProps {
    className: string;
    content: string;
    isHtml?: boolean;
}

const Content: FC<ContentProps> = memo(({ className, content, isHtml }) => {
    if (isHtml) return <span className={className} dangerouslySetInnerHTML={{ __html: content }} />;
    return <span className={className}>{content}</span>;
});
Content.displayName = 'Content';

interface NotificationContentProps {
    data: ServerActivityData;
}

const NotificationContent: FC<NotificationContentProps> = memo(({ data }) => {
    const { Content: content, hasError, inProgress } = data;
    const isUnread = data.isUnread() && !inProgress;
    const className = classNames('server-notification-message', {
        'is-unread server-notifications-item': isUnread,
    });
    const isHtml = data.isHTML();
    const newlineIndex = content.toLowerCase().indexOf('\n');
    const brIndex = content.toLowerCase().indexOf('<br>');
    let subject: string, details: string;
    let body: ReactNode;
    if (newlineIndex > 0 || brIndex > 0) {
        if (newlineIndex > 0) {
            subject = content.substr(0, newlineIndex);
            details = content.substring(newlineIndex + 1, content.length);
        } else {
            subject = content.substr(0, brIndex);
            details = content.substring(brIndex + 4, content.length);
        }

        const detailsDisplay = hasError ? resolveErrorMessage(details) : details;
        body = (
            <>
                <Content className="server-notifications-item-subject" content={subject} isHtml={isHtml} />
                {detailsDisplay && (
                    <>
                        <br />
                        <Content
                            className="server-notifications-item-details"
                            content={detailsDisplay}
                            isHtml={isHtml}
                        />
                    </>
                )}
            </>
        );
    } else if (inProgress) {
        body = (
            <Content
                className="server-notifications-item-subject"
                content={`A background import is processing: ${content}`}
                isHtml={isHtml}
            />
        );
    } else {
        body = <Content className="server-notifications-item-subject" content={content} isHtml={isHtml} />;
    }

    return <span className={className}>{body}</span>;
});
NotificationContent.displayName = 'NotificationContent';

interface ActivityItemProps {
    data: ServerActivityData;
    onRead: (rowId: number) => void;
    onViewClick: () => void;
}

const ActivityItem: FC<ActivityItemProps> = memo(({ data, onRead, onViewClick }) => {
    const isUnread = data.isUnread() && !data.inProgress;
    const rowId = data.RowId;
    const resolvedUrl = resolveActionLinkUrl(data.ActionLinkUrl, rowId);
    const className = isUnread ? 'is-unread' : undefined;
    const iconClassName = classNames('fa', {
        'fa-spinner fa-pulse': data.inProgress,
        'fa-exclamation-circle has-error': data.hasError,
        'fa-check-circle is-complete': !data.inProgress && !data.hasError,
    });

    const actionLinkText = capitalizeFirstChar(data.ActionLinkText ? data.ActionLinkText : defaultActionLinkText);
    const onClick = useCallback(() => onRead(rowId), [onRead, rowId]);

    return (
        <li className={className} onClick={onClick}>
            <span className={iconClassName} />
            <NotificationContent data={data} />
            <br />
            {resolvedUrl && (
                <AppLink to={resolvedUrl} onClick={onViewClick}>
                    {actionLinkText}
                </AppLink>
            )}
            {!resolvedUrl && (
                <span className="server-notification-data" title={data.CreatedBy}>
                    {data.CreatedBy}
                </span>
            )}
            <div className="pull-right server-notification-data">{formatDateTime(parseDate(data.Created))}</div>
        </li>
    );
});
ActivityItem.displayName = 'ActivityItem';

interface Props {
    onRead: (id: number) => void;
    onViewAll: () => void;
    onViewClick: () => void;
    serverActivity: ServerActivity;
}

export const ServerActivityList: FC<Props> = memo(({ serverActivity, onRead, onViewAll, onViewClick }) => {
    if (!serverActivity || serverActivity.totalRows === 0) {
        return <div className="server-notifications-footer">No notifications available.</div>;
    }

    return (
        <>
            <div className="server-notifications-listing-container">
                <ul className="server-notifications-listing">
                    {serverActivity.data.slice(0, SERVER_NOTIFICATION_MAX_ROWS).map(data => (
                        <ActivityItem data={data} key={data.RowId} onRead={onRead} onViewClick={onViewClick} />
                    ))}
                </ul>
            </div>
            <div className="server-notifications-footer">
                <AppLink to={AppURL.create('pipeline')} className="server-notifications-link" onClick={onViewAll}>
                    View all activity
                </AppLink>
            </div>
        </>
    );
});
ServerActivityList.displayName = 'ServerActivityList';
