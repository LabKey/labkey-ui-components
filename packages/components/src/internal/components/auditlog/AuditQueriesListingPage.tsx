/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { fromJS } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { WithRouterProps } from 'react-router';

import { GridPanel } from '../../../public/QueryModel/GridPanel';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Page } from '../base/Page';
import { PageHeader } from '../base/PageHeader';
import { SelectInput, SelectInputChange } from '../forms/input/SelectInput';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { useServerContext } from '../base/ServerContext';

import { SCHEMAS } from '../../schemas';

import { resolveErrorMessage } from '../../util/messaging';

import { User } from '../base/models/User';

import { getAuditQueries } from './utils';
import { getAuditDetail } from './actions';
import { AuditDetailsModel } from './models';
import { AuditDetails } from './AuditDetails';
import {
    AuditQuery,
    AUDIT_EVENT_TYPE_PARAM,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    QUERY_UPDATE_AUDIT_QUERY,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
    PROJECT_AUDIT_QUERY,
    ASSAY_AUDIT_QUERY,
    EXPERIMENT_AUDIT_EVENT,
} from './constants';

interface OwnProps {
    eventType: string;
    selectedQuery: AuditQuery;
    user: User;
}

const AuditQueriesListingPageBody: FC<InjectedQueryModels & OwnProps> = memo(props => {
    const { actions, eventType, queryModels, selectedQuery, user } = props;
    const { hasDetail } = selectedQuery;
    const model = queryModels[eventType];

    const [detail, setDetail] = useState<AuditDetailsModel>();
    const [error, setError] = useState<string>();
    const selectedRowId = useMemo<number>(() => {
        if (model.isLoading || model.hasLoadErrors || !model.selections) return undefined;
        return parseInt(Array.from(model.selections).pop(), 10);
    }, [model]);

    useEffect(() => {
        if (!selectedRowId || !selectedQuery.hasDetail) {
            setError(undefined);
            setDetail(undefined);
            return;
        }

        (async () => {
            try {
                const { value } = selectedQuery;
                const isQueryDataUpdate =
                    value === SOURCE_AUDIT_QUERY.value || value === DATACLASS_DATA_UPDATE_AUDIT_QUERY.value;
                let auditEventType = isQueryDataUpdate ? QUERY_UPDATE_AUDIT_QUERY.value : value;
                const isAssayEvent = value === ASSAY_AUDIT_QUERY.value;
                if (isAssayEvent)
                    auditEventType = EXPERIMENT_AUDIT_EVENT;
                const detail_ = await getAuditDetail(selectedRowId, auditEventType);
                setDetail(detail_.merge({ rowId: selectedRowId }) as AuditDetailsModel);
                setError(undefined);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load audit details');
            }
        })();
    }, [selectedQuery, selectedRowId]);

    const gridData = useMemo(() => {
        if (!detail) return undefined;
        const { eventUserId, eventDateFormatted, userComment } = detail;
        const rows = [];

        if (eventUserId) {
            rows.push({ field: detail.getActionLabel() + ' By', isUser: true, value: eventUserId });
        }
        if (eventDateFormatted) {
            rows.push({ field: 'Date', value: eventDateFormatted });
        }
        if (userComment) {
            rows.push({ field: 'User Comment', value: userComment });
        }

        return fromJS(rows);
    }, [detail]);

    if (hasDetail) {
        return (
            <Row>
                <Col xs={12} md={8}>
                    <GridPanel actions={actions} highlightLastSelectedRow model={model} />
                </Col>
                <Col xs={12} md={4}>
                    <AuditDetails
                        changeDetails={detail}
                        gridData={gridData}
                        rowId={selectedRowId}
                        summary={detail?.comment}
                        user={user}
                    >
                        {error && <Alert>{error}</Alert>}
                        {!!selectedRowId && !detail && !error && <LoadingSpinner />}
                    </AuditDetails>
                </Col>
            </Row>
        );
    }

    return <GridPanel actions={actions} model={model} />;
});

const AuditQueriesListingBodyWithModels = withQueryModels<OwnProps>(AuditQueriesListingPageBody);

export const AuditQueriesListingPage: FC<WithRouterProps> = memo(({ location, router }) => {
    const locationEventType = location.query?.eventType;
    const [eventType, setEventType] = useState<string>(() => locationEventType ?? SAMPLE_TIMELINE_AUDIT_QUERY.value);
    const { moduleContext, project, user } = useServerContext();
    const auditQueries = useMemo(() => getAuditQueries(moduleContext), [moduleContext]);
    const selectedQuery = useMemo(() => auditQueries.find(q => q.value === eventType), [auditQueries, eventType]);
    const queryConfigs = useMemo<QueryConfigMap>(() => {
        if (!selectedQuery) return undefined;
        const { value } = selectedQuery;
        const baseFilters: Filter.IFilter[] = [];
        if (PROJECT_AUDIT_QUERY.value === value) {
            // Issue 47512: App audit log filters out container events for deleted containers
            baseFilters.push(Filter.create('projectId', project.id));
        }

        return {
            [value]: {
                baseFilters,
                bindURL: true,
                containerFilter: selectedQuery.containerFilter,
                id: value,
                includeTotalCount: true,
                schemaQuery: new SchemaQuery(SCHEMAS.AUDIT_TABLES.SCHEMA, value),
                // Not using saved settings here since we reuse the same urlPrefix for all models
                useSavedSettings: false,
            },
        };
    }, [project.id, selectedQuery]);

    useEffect(() => {
        if (locationEventType) {
            setEventType(locationEventType);
        }
    }, [locationEventType]);

    const onChange = useCallback<SelectInputChange>(
        (_, eventType_) => {
            if (eventType_ === eventType) return;
            const query = Object.keys(location.query).reduce((query_, key) => {
                // remove query parameters from next model event type
                if (!key.startsWith('query.')) {
                    if (key === AUDIT_EVENT_TYPE_PARAM) {
                        query_[key] = eventType_;
                    } else {
                        query_[key] = location.query[key];
                    }
                }

                return query_;
            }, {});
            router.replace({ ...location, query });
            setEventType(eventType_);
        },
        [eventType, location, router]
    );

    const title = 'Audit Logs';
    return (
        <Page hasHeader title={title}>
            <PageHeader title={title} />
            <SelectInput
                clearable={false}
                inputClass="col-xs-6"
                key="audit-log-query-select"
                name="audit-log-query-select"
                onChange={onChange}
                options={auditQueries}
                placeholder="Select an audit event type..."
                value={selectedQuery ? eventType : undefined}
            />
            {!selectedQuery && eventType && (
                <Alert>Audit Event Type "{eventType}" Not Found. Please select an audit event type above.</Alert>
            )}
            {selectedQuery && (
                <AuditQueriesListingBodyWithModels
                    eventType={eventType}
                    key={eventType}
                    queryConfigs={queryConfigs}
                    selectedQuery={selectedQuery}
                    user={user}
                />
            )}
        </Page>
    );
});
