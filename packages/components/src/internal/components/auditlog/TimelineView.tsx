import React, { ReactNode } from 'react';
import classNames from 'classnames';

import { SVGIcon } from '../base/SVGIcon';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { UserLink } from '../user/UserLink';

import { TimelineEventModel, TimelineGroupedEventInfo } from './models';
import { getEventDataValueDisplay } from './utils';

interface Props {
    events: TimelineEventModel[];
    getInfoBubbleContent?: (event: TimelineEventModel) => { content: ReactNode; title: string };
    onEventSelection?: (selectedEvent: TimelineEventModel) => any;
    selectedEntityConnectionInfo?: TimelineGroupedEventInfo[];
    selectedEvent?: TimelineEventModel;
    selectionDisabled?: boolean;
    showRecentFirst: boolean;
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

        return (
            <tr
                key={event.getRowKey()}
                onClick={() => {
                    if (event.rowId) this.selectEvent(event);
                }}
                className={classNames({
                    'timeline-event-row': event.rowId !== 0,
                    'timeline-row-selected': eventSelected,
                })}
            >
                {this.renderTimestampCol(event.timestamp)}
                {this.renderIconCol(
                    event.getIcon(),
                    eventSelected,
                    isFirstEvent,
                    isLastEvent,
                    isEventCompleted,
                    isConnection
                )}
                {this.renderDetailCol(event)}
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

        return (
            <LabelHelpTip
                iconComponent={<i className="timeline-comments-icon fa fa-comments" />}
                placement="bottom"
            >
                <div className="ws-pre-wrap">{comment}</div>
            </LabelHelpTip>
        );
    }

    renderInfoBubble(event: TimelineEventModel) {
        const { getInfoBubbleContent } = this.props;

        if (getInfoBubbleContent) {
            const info = getInfoBubbleContent(event);
            if (info != null) {
                return (
                    <LabelHelpTip
                        iconComponent={<i className="timeline-info-icon fa fa-info-circle" />}
                        placement="bottom"
                        title={info.title}
                    >
                        <div className="ws-pre-wrap">{info.content}</div>
                    </LabelHelpTip>
                );
            }
        }

        return null;
    }

    renderDetailCol(event: TimelineEventModel) {
        const { summary, user, entity, entitySeparator } = event;
        const comment = event.getComment();
        return (
            <td key="tl-detail-col" className="detail-col">
                <div>
                    {getEventDataValueDisplay(summary)}
                    {entity != null && <span>{entitySeparator ? entitySeparator : ' - '}</span>}
                    {entity != null && getEventDataValueDisplay(entity)}
                </div>
                <div>
                    <div className="field-text-nowrap">
                        <UserLink
                            userId={user?.get('value')}
                            userDisplayValue={user?.get('displayValue')}
                            unknown={!user}
                        />
                    </div>{' '}
                    {this.renderComment(comment)}
                    {this.renderInfoBubble(event)}
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
                        if (event.rowId > 0) return this.renderRow(event);
                    })}
                </tbody>
            </table>
        );
    }
}
