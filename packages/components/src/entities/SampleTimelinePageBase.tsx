import React, { FC, memo, ReactNode, useEffect, useState } from 'react';

import { Col, Panel, Row } from 'react-bootstrap';

import { Iterable } from 'immutable';

import { QueryConfig, QueryModel } from '../public/QueryModel/QueryModel';

import { User } from '../internal/components/base/models/User';
import { Alert } from '../internal/components/base/Alert';
import { NotFound } from '../internal/components/base/NotFound';

import { AuditDetails } from '../internal/components/auditlog/AuditDetails';
import { AppURL, createProductUrlFromParts } from '../internal/url/AppURL';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { TimelineEventModel } from '../internal/components/auditlog/models';
import { SampleStatus } from '../internal/components/samples/models';
import { parseCsvString } from '../internal/util/utils';
import {
    BOXES_KEY,
    FREEZER_MANAGER_APP_PROPERTIES,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SOURCES_KEY,
} from '../internal/app/constants';
import { isLoading } from '../public/LoadingState';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { getEventDataValueDisplay, getTimelineEntityUrl } from '../internal/components/auditlog/utils';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { SampleEventListing } from './SampleEventListing';
import {getPrimaryAppProperties, isBiologicsEnabled} from "../internal/app/utils";

interface OwnProps {
    api?: ComponentsAPIWrapper;
    // for jest test only
    initialSelectedEvent?: TimelineEventModel;
    renderAdditionalCurrentStatus?: (
        jobsModel: QueryModel,
        renderCurrentStatusDetailRowFn: (label: string, valueNode: any) => ReactNode
    ) => ReactNode;
    sampleId: number;
    sampleJobsGidId?: string;
    sampleJobsGridConfig: QueryConfig;
    sampleName: string;
    sampleSet: string;
    sampleStatus: SampleStatus;
    // for jest test
    skipAuditDetailUserLoading?: boolean;
    // for jest test on teamcity
    timezoneAbbr?: string;

    user: User;
}

// export for jest
export const SampleTimelinePageBaseImpl: FC<OwnProps & InjectedQueryModels> = memo(props => {
    const {
        api,
        initialSelectedEvent,
        sampleId,
        sampleName,
        sampleSet,
        sampleStatus,
        timezoneAbbr,
        user,
        skipAuditDetailUserLoading,
        renderAdditionalCurrentStatus,
        queryModels,
        sampleJobsGidId,
    } = props;

    const [events, setEvents] = useState<TimelineEventModel[]>(undefined);
    const [timelineLoaded, setTimelineLoaded] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEventModel>(initialSelectedEvent);
    const [error, setError] = useState<React.ReactNode>(undefined);

    const loadTimeline = async () => {
        setTimelineLoaded(false);
        setEvents(undefined);

        try {
            const timelineEvents = await api.samples.getTimelineEvents(sampleId, timezoneAbbr);
            setEvents(timelineEvents);
            setTimelineLoaded(true);
        } catch (error) {
            setTimelineLoaded(true);
            setError(error);
        }
    };

    useEffect(() => {
        loadTimeline();
    }, [sampleId]);

    const onEventSelection = selectedEvent => {
        setSelectedEvent(selectedEvent);
    };

    const renderEventListing = () => {
        return (
            <SampleEventListing
                showUserLinks={user.isAdmin}
                sampleId={sampleId}
                sampleName={sampleName}
                onEventSelection={onEventSelection}
                events={events}
                selectedEvent={selectedEvent}
            />
        );
    };

    const getMaterialDataInputDisplay = (
        datatypeKey: string,
        datatypeName: string,
        value: string,
        inputPrefix: string
    ): any => {
        const parts = parseCsvString(value.replace(inputPrefix, ''), ',', true);
        const parents = [];
        for (let i = 0; i < parts.length; i += 2) {
            const name = parts[i],
                id = parts[i + 1];
            if (id === '0') {
                parents.push(name);
            } else {
                const link = AppURL.create(datatypeKey, datatypeName, id).toHref();
                parents.push(<a href={link}>{name}</a>);
            }
        }
        return (
            <>
                {parents.map((parent, ind) => {
                    return (
                        <span key={datatypeName + '-' + ind}>
                            {parent}
                            {ind < parents.length - 1 ? ',' : ''}&nbsp;
                        </span>
                    );
                })}
            </>
        );
    };

    const auditDetailValueRenderer = (field: string, value: string, displayValue: any): any => {
        if (field.toLowerCase() === 'sample id') {
            const sampleLink = AppURL.create(SAMPLES_KEY, sampleSet, sampleId).toHref();
            return <a href={sampleLink}>{value}</a>;
        }

        if (value && value.startsWith('materialinputs/')) {
            return getMaterialDataInputDisplay(SAMPLES_KEY, field.toLowerCase(), value, 'materialinputs/');
        } else if (value && value.startsWith('datainputs/')) {
            return getMaterialDataInputDisplay(getPrimaryAppProperties().dataclassUrlPart, field.toLowerCase(), value, 'datainputs/');
        }

        return displayValue;
    };

    const gridColumnRenderer = (data: any, row: any, displayValue: any): any => {
        if (Iterable.isIterable(data)) {
            if (data.get('urlType') === 'box') {
                const boxId = data.get('value');
                const label = displayValue || data.get('displayValue');
                if (boxId && label) {
                    let boxLink;
                    boxLink = createProductUrlFromParts(
                        FREEZER_MANAGER_APP_PROPERTIES.productId,
                        SAMPLE_MANAGER_APP_PROPERTIES.productId,
                        undefined,
                        BOXES_KEY,
                        boxId
                    );
                    return <a href={boxLink}>{label}</a>;
                }
            }
            if (data.get('urlType') === 'boxCell') {
                const cellKey = data.get('value');
                const [boxId, row, col] = cellKey.split('-');
                const label = displayValue || data.get('displayValue');
                if (cellKey && label) {
                    let cellLink;
                    const params = { detailsTab: 'history', row, col };
                    cellLink = createProductUrlFromParts(
                        FREEZER_MANAGER_APP_PROPERTIES.productId,
                        SAMPLE_MANAGER_APP_PROPERTIES.productId,
                        params,
                        BOXES_KEY,
                        boxId
                    );
                    return <a href={cellLink}>{label}</a>;
                }
            }
        }

        return displayValue;
    };

    const renderEventDetails = () => {
        return (
            <AuditDetails
                title="Event Details"
                emptyMsg="No event selected"
                user={user}
                rowId={selectedEvent ? selectedEvent.rowId : undefined}
                summary={selectedEvent ? selectedEvent.summary : undefined}
                hasUserField={!skipAuditDetailUserLoading}
                gridData={selectedEvent ? selectedEvent.metadata : undefined}
                changeDetails={selectedEvent ? selectedEvent.getAuditDetailsModel() : undefined}
                fieldValueRenderer={auditDetailValueRenderer}
                gridColumnRenderer={
                    selectedEvent && selectedEvent.eventType == 'inventory' ? gridColumnRenderer : undefined
                }
            />
        );
    };

    const renderCurrentStatusDetailRow = (label: string, valueNode: any): ReactNode => {
        return (
            <Row className="bottom-spacing">
                <Col xs={6}>{label}</Col>
                <Col xs={6}>
                    <span className="pull-right field-hide-overflow">{valueNode}</span>
                </Col>
            </Row>
        );
    };

    const renderCurrentStatusDetails = () => {
        const sampleJobsModel = queryModels[sampleJobsGidId];
        if (renderAdditionalCurrentStatus && (!sampleJobsModel || isLoading(sampleJobsModel.rowsLoadingState)))
            return <LoadingSpinner />;

        const registrationEvent = events[0];
        const lastEvent = events[events.length - 1];

        const registrationStatus = (
            <>
                {renderCurrentStatusDetailRow(
                    'Registered By',
                    getEventDataValueDisplay(registrationEvent.user, user.isAdmin)
                )}
                {renderCurrentStatusDetailRow(
                    'Registration Date',
                    getEventDataValueDisplay(registrationEvent.timestamp)
                )}
            </>
        );

        const eventLink = lastEvent.entity?.has('urlType')
            ? getTimelineEntityUrl(lastEvent.entity.toJS()).toHref()
            : undefined;
        const eventDisplay = eventLink ? <a href={eventLink}>{lastEvent.summary}</a> : lastEvent.summary;
        const lastEventStatus = (
            <>
                {renderCurrentStatusDetailRow('Last Event', eventDisplay)}
                {renderCurrentStatusDetailRow(
                    'Last Event Handled By',
                    getEventDataValueDisplay(lastEvent.user, user.isAdmin)
                )}
                {renderCurrentStatusDetailRow('Last Event Date', getEventDataValueDisplay(lastEvent.timestamp))}
            </>
        );

        return (
            <>
                {registrationStatus}
                {renderCurrentStatusDetailRow('Sample Status', <SampleStatusTag status={sampleStatus} />)}
                {renderAdditionalCurrentStatus?.(sampleJobsModel, renderCurrentStatusDetailRow)}
                {lastEventStatus}
            </>
        );
    };

    const renderCurrentStatus = () => {
        return (
            <Panel>
                <Panel.Heading>Current Status</Panel.Heading>
                <Panel.Body>{renderCurrentStatusDetails()}</Panel.Body>
            </Panel>
        );
    };

    if (error) return <Alert bsStyle="danger">{error}</Alert>;

    if (!timelineLoaded) return <LoadingSpinner />;

    if (!events) return <NotFound />;

    if (events.length === 0) return <Alert bsStyle="danger">Unable to load timeline events</Alert>;

    return (
        <Row>
            <Col xs={12} md={8}>
                {renderEventListing()}
            </Col>
            <Col xs={12} md={4}>
                {renderCurrentStatus()}
                {renderEventDetails()}
            </Col>
        </Row>
    );
});

const SampleTimelinePageWithQueryModel = withQueryModels<OwnProps>(SampleTimelinePageBaseImpl);

export const SampleTimelinePageBase: FC<OwnProps> = memo(props => {
    const { sampleJobsGridConfig } = props;

    const queryConfigs = {};
    queryConfigs[sampleJobsGridConfig.id] = sampleJobsGridConfig;

    return (
        <SampleTimelinePageWithQueryModel
            {...props}
            sampleJobsGidId={sampleJobsGridConfig.id}
            queryConfigs={queryConfigs}
            autoLoad={true}
        />
    );
});

SampleTimelinePageBase.defaultProps = {
    api: getDefaultAPIWrapper(),
};
