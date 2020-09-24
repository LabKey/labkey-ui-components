import React from 'react';
import classNames from 'classnames';

import { App, getEventDataValueDisplay, LabelHelpTip, SVGIcon } from '../../..';

import { TimelineEventModel, TimelineGroupedEventInfo } from './models';

interface Props {
    events: TimelineEventModel[];
    selectionDisabled?: boolean;
    onEventSelection?: (selectedEvent: TimelineEventModel) => any;
    showRecentFirst: boolean;
    selectedEvent?: TimelineEventModel;
    showUserLinks?: boolean;
    selectedEntityConnectionInfo?: TimelineGroupedEventInfo[];
}

export class TimelineView extends React.Component<Props, any> {
    selectEvent = (selectedEvent: TimelineEventModel) => {
        const { onEventSelection, selectionDisabled } = this.props;

        if (onEventSelection && !selectionDisabled) this.props.onEventSelection(selectedEvent);
    };

    renderRow(event: TimelineEventModel): any {
        const { selectedEvent, selectedEntityConnectionInfo } = this.props;
        let eventSelected = false;
        let isFirstEvent = false;
        let isLastEvent = false;
        let isEventCompleted = false;
        let isConnection = false;

        if (selectedEvent && selectedEvent.getRowKey() === event.getRowKey()) {
            eventSelected = true;
        }

        if (selectedEntityConnectionInfo && selectedEntityConnectionInfo.length > 0) {
            selectedEntityConnectionInfo.forEach(info => {
                const inRange: boolean =
                    info.firstEvent &&
                    info.lastEvent &&
                    event.eventTimestamp >= info.firstEvent.eventTimestamp &&
                    event.eventTimestamp <= info.lastEvent.eventTimestamp;
                if (inRange) {
                    isEventCompleted = info.isCompleted;
                    isConnection = true;
                    if (info.firstEvent && event.getRowKey() === info.firstEvent.getRowKey()) {
                        isFirstEvent = true;
                    } else if (info.lastEvent && event.getRowKey() === info.lastEvent.getRowKey()) {
                        isLastEvent = true;
                    }
                } else if (info.firstEvent && event.getRowKey() === info.firstEvent.getRowKey()) isFirstEvent = true;
            });
        }

        // TODO update with inventory icon when available
        const icon =
            event.eventType === App.ASSAYS_KEY
                ? 'assay'
                : event.eventType === 'inventory'
                ? 'default'
                : event.eventType;
        return (
            <tr
                key={event.getRowKey()}
                onClick={() => {
                    this.selectEvent(event);
                }}
                className={classNames('timeline-event-row', { 'timeline-row-selected': eventSelected })}
            >
                {this.renderTimestampCol(event.timestamp)}
                {this.renderIconCol(icon, eventSelected, isFirstEvent, isLastEvent, isEventCompleted, isConnection)}
                {this.renderDetailCol(event.summary, event.user, event.entity, event.getComment())}
            </tr>
        );
    }

    renderTimestampCol(timestamp) {
        return (
            <td key="tl-timestamp-col" className="display-light timeline-timestamp-col">
                {getEventDataValueDisplay(timestamp)}
            </td>
        );
    }

    renderIconCol(
        iconSrc: string,
        isSelected?: boolean,
        isFirstEvent?: boolean,
        isLastEvent?: boolean,
        isClosedEvent?: boolean,
        isConnection?: boolean
    ) {
        const { showRecentFirst } = this.props;

        const icon = (
            <SVGIcon
                iconDir="_images"
                iconSrc={isSelected ? iconSrc + '_orange' : iconSrc}
                className="timeline-event-icon"
                alt={iconSrc ? iconSrc : ''}
            />
        );

        const isStart = showRecentFirst ? !isFirstEvent : isFirstEvent;
        const isEnd = showRecentFirst ? !isLastEvent : isLastEvent;

        const circle = (
            <div>
                <span className={classNames('timeline-circle', { 'timeline-circle-open': !isClosedEvent })} />
                <span className="timeline-hline hline-short" />
            </div>
        );

        const shortVLineStart = (
            <div className={classNames('timeline-vline vline-short', { 'line-highlight': isConnection && !isStart })} />
        );

        const shortVLineEnd = (
            <div className={classNames('timeline-vline vline-short', { 'line-highlight': isConnection && !isEnd })} />
        );

        const longVLine = (
            <div>
                <span className={classNames('timeline-vline vline-long', { 'line-highlight': isConnection })} />
                <span className="timeline-hline hline-long" />
            </div>
        );

        let line;
        if (isFirstEvent || isLastEvent) {
            line = (
                <>
                    {shortVLineStart}
                    {circle}
                    {shortVLineEnd}
                </>
            );
        } else {
            line = longVLine;
        }
        return (
            <td key="tl-icon-col" className="icon-col">
                <div>
                    <div className="timeline-line">{line}</div>
                    {icon}
                </div>
            </td>
        );
    }

    renderComment(comment: string): React.ReactNode {
        if (!comment) return null;

        const icon = <i className="timeline-comments-icon fa fa-comments" />;
        return (
            <LabelHelpTip
                title="Comment"
                body={() => {
                    return <div className="detail-display">{comment}</div>;
                }}
                placement="bottom"
                iconComponent={() => {
                    return icon;
                }}
            />
        );
    }

    renderDetailCol(summary: string, user: any, entity: any, comment: string) {
        const { showUserLinks } = this.props;
        return (
            <td key="tl-detail-col" className="detail-col">
                <div>
                    {getEventDataValueDisplay(summary)}
                    {entity != null && <span> - </span>}
                    {entity != null && getEventDataValueDisplay(entity)}
                </div>
                <div>
                    {getEventDataValueDisplay(user, showUserLinks)} {this.renderComment(comment)}
                </div>
            </td>
        );
    }

    render() {
        const { events, selectionDisabled } = this.props;
        return (
            <table
                className={classNames('timeline-grid', {
                    'timeline-grid-no-selection': selectionDisabled,
                })}
            >
                <tbody>
                    {events.map(event => {
                        return this.renderRow(event);
                    })}
                </tbody>
            </table>
        );
    }
}
