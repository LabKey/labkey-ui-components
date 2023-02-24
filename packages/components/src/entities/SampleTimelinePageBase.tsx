import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';

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
} from '../internal/app/constants';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { getEventDataValueDisplay, getTimelineEntityUrl } from '../internal/components/auditlog/utils';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getPrimaryAppProperties } from '../internal/app/utils';

import { UserLink } from '../internal/components/user/UserLink';

import { SampleEventListing } from './SampleEventListing';

interface StatusDetailRowProps {
    label: ReactNode;
}

const StatusDetailRow: FC<StatusDetailRowProps> = memo(({ children, label }) => (
    <Row className="bottom-spacing">
        <Col xs={6}>{label}</Col>
        <Col xs={6}>
            <span className="pull-right field-hide-overflow">{children}</span>
        </Col>
    </Row>
));

const renderCurrentStatusDetailRow = (label: string, valueNode: any): ReactNode => (
    <StatusDetailRow label={label}>{valueNode}</StatusDetailRow>
);

const gridColumnRenderer = (data: any, row: any, displayValue: any): ReactNode => {
    if (Iterable.isIterable(data)) {
        if (data.get('urlType') === 'box') {
            const boxId = data.get('value');
            const label = displayValue || data.get('displayValue');
            if (boxId && label) {
                const boxLink = createProductUrlFromParts(
                    FREEZER_MANAGER_APP_PROPERTIES.productId,
                    SAMPLE_MANAGER_APP_PROPERTIES.productId,
                    undefined,
                    BOXES_KEY,
                    boxId
                );
                return <a href={boxLink.toString()}>{label}</a>;
            }
        }
        if (data.get('urlType') === 'boxCell') {
            const cellKey = data.get('value');
            const [boxId, row, col] = cellKey.split('-');
            const label = displayValue || data.get('displayValue');
            if (cellKey && label) {
                const cellLink = createProductUrlFromParts(
                    FREEZER_MANAGER_APP_PROPERTIES.productId,
                    SAMPLE_MANAGER_APP_PROPERTIES.productId,
                    { detailsTab: 'history', row, col },
                    BOXES_KEY,
                    boxId
                );
                return <a href={cellLink.toString()}>{label}</a>;
            }
        }
    }

    return displayValue;
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

interface OwnProps {
    api?: ComponentsAPIWrapper;
    // for jest test only
    initialSelectedEvent?: TimelineEventModel;
    renderAdditionalCurrentStatus?: (
        jobsModel: QueryModel,
        renderCurrentStatusDetailRowFn: (label: string, valueNode: any) => ReactNode
    ) => ReactNode;
    sampleId: number;
    sampleName: string;
    sampleSet: string;
    sampleStatus: SampleStatus;
    // for jest test on teamcity
    timezoneAbbr?: string;
    user: User;
}

export type SampleTimelinePageBaseImplProps = OwnProps & InjectedQueryModels;

// export for jest
export const SampleTimelinePageBaseImpl: FC<SampleTimelinePageBaseImplProps> = memo(props => {
    const {
        api,
        initialSelectedEvent,
        sampleId,
        sampleName,
        sampleSet,
        sampleStatus,
        timezoneAbbr,
        user,
        renderAdditionalCurrentStatus,
        queryModels,
    } = props;

    const [events, setEvents] = useState<TimelineEventModel[]>();
    const [timelineLoaded, setTimelineLoaded] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEventModel>(initialSelectedEvent);
    const [error, setError] = useState<ReactNode>();

    useEffect(() => {
        (async () => {
            setTimelineLoaded(false);

            try {
                const timelineEvents = await api.samples.getTimelineEvents(sampleId, timezoneAbbr);
                setEvents(timelineEvents);
                setTimelineLoaded(true);
            } catch (_error) {
                setEvents(undefined);
                setTimelineLoaded(true);
                setError(_error);
            }
        })();
    }, [api, sampleId, timezoneAbbr]);

    const auditDetailValueRenderer = useCallback(
        (field: string, value: string, displayValue: any): ReactNode => {
            if (field.toLowerCase() === 'sample id') {
                const sampleLink = AppURL.create(SAMPLES_KEY, sampleSet, sampleId).toHref();
                return <a href={sampleLink}>{value}</a>;
            }

            if (value?.startsWith('materialinputs/')) {
                return getMaterialDataInputDisplay(SAMPLES_KEY, field.toLowerCase(), value, 'materialinputs/');
            } else if (value?.startsWith('datainputs/')) {
                return getMaterialDataInputDisplay(
                    getPrimaryAppProperties().dataClassUrlPart,
                    field.toLowerCase(),
                    value,
                    'datainputs/'
                );
            }

            return displayValue;
        },
        [sampleId, sampleSet]
    );

    if (error) return <Alert bsStyle="danger">{error}</Alert>;
    if (!timelineLoaded) return <LoadingSpinner />;
    if (!events) return <NotFound />;
    if (events.length === 0) return <Alert bsStyle="danger">Unable to load timeline events</Alert>;

    const sampleJobsModel = queryModels[Object.keys(queryModels)[0]];
    const isAdditionalStatusLoading = !!renderAdditionalCurrentStatus && sampleJobsModel.isLoading;

    const registrationEvent = events[0];
    const lastEvent = events[events.length - 1];

    const eventLink = lastEvent.entity?.has('urlType')
        ? getTimelineEntityUrl(lastEvent.entity.toJS()).toHref()
        : undefined;

    return (
        <Row>
            <Col xs={12} md={8}>
                <SampleEventListing
                    sampleId={sampleId}
                    sampleName={sampleName}
                    onEventSelection={setSelectedEvent}
                    events={events}
                    selectedEvent={selectedEvent}
                />
            </Col>
            <Col xs={12} md={4}>
                <Panel>
                    <Panel.Heading>Current Status</Panel.Heading>
                    <Panel.Body>
                        {isAdditionalStatusLoading && <LoadingSpinner />}
                        {!isAdditionalStatusLoading && (
                            <>
                                <StatusDetailRow label="Registered By">
                                    <UserLink
                                        userId={registrationEvent.user?.get('value')}
                                        userDisplayValue={registrationEvent.user?.get('displayValue')}
                                        unknown={!registrationEvent.user}
                                    />
                                </StatusDetailRow>
                                <StatusDetailRow label="Registration Date">
                                    {getEventDataValueDisplay(registrationEvent.timestamp)}
                                </StatusDetailRow>
                                <StatusDetailRow label="Sample Status">
                                    <SampleStatusTag status={sampleStatus} />
                                </StatusDetailRow>
                                {renderAdditionalCurrentStatus?.(sampleJobsModel, renderCurrentStatusDetailRow)}
                                <StatusDetailRow label="Last Event">
                                    {eventLink ? <a href={eventLink}>{lastEvent.summary}</a> : lastEvent.summary}
                                </StatusDetailRow>
                                <StatusDetailRow label="Last Event Handled By">
                                    <UserLink
                                        userId={lastEvent.user?.get('value')}
                                        userDisplayValue={lastEvent.user?.get('displayValue')}
                                        unknown={!lastEvent.user}
                                    />
                                </StatusDetailRow>
                                <StatusDetailRow label="Last Event Date">
                                    {getEventDataValueDisplay(lastEvent.timestamp)}
                                </StatusDetailRow>
                            </>
                        )}
                    </Panel.Body>
                </Panel>
                <AuditDetails
                    changeDetails={selectedEvent?.getAuditDetailsModel()}
                    emptyMsg="No event selected"
                    fieldValueRenderer={auditDetailValueRenderer}
                    gridColumnRenderer={selectedEvent?.eventType === 'inventory' ? gridColumnRenderer : undefined}
                    gridData={selectedEvent?.metadata}
                    rowId={selectedEvent?.rowId}
                    summary={selectedEvent?.summary}
                    title="Event Details"
                    user={user}
                />
            </Col>
        </Row>
    );
});

SampleTimelinePageBaseImpl.defaultProps = {
    api: getDefaultAPIWrapper(),
};

const SampleTimelinePageWithQueryModel = withQueryModels<OwnProps>(SampleTimelinePageBaseImpl);

interface SampleTimelinePageBaseProps extends OwnProps {
    sampleJobsGridConfig: QueryConfig;
}

export const SampleTimelinePageBase: FC<SampleTimelinePageBaseProps> = memo(props => {
    const { sampleJobsGridConfig, ...ownProps } = props;
    const queryConfigs = { [sampleJobsGridConfig.id]: sampleJobsGridConfig };

    return <SampleTimelinePageWithQueryModel {...ownProps} autoLoad queryConfigs={queryConfigs} />;
});
