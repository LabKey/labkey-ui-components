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

import { getLocation, replaceParameters } from '../../util/URL';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Page } from '../base/Page';
import { PageHeader } from '../base/PageHeader';
import { SelectInput, SelectInputChange } from '../forms/input/SelectInput';
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { useServerContext } from '../base/ServerContext';

import { SCHEMAS } from '../../schemas';

import { resolveErrorMessage } from '../../util/messaging';

import { getAuditQueries } from './utils';
import { getAuditDetail } from './actions';
import { AuditDetailsModel } from './models';
import { AuditDetails } from './AuditDetails';
import {
    AUDIT_EVENT_TYPE_PARAM,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    DATA_UPDATE_AUDIT_QUERY,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
    PROJECT_AUDIT_QUERY,
} from './constants';

interface OwnProps {
    eventType?: string;
    onChange: (eventType: string) => void;
}

const AuditQueriesListingPageImpl: FC<InjectedQueryModels & OwnProps> = memo(props => {
    const { actions, onChange, queryModels } = props;
    const { moduleContext, project, user } = useServerContext();

    const [detail, setDetail] = useState<AuditDetailsModel>();
    const [error, setError] = useState<string>();
    const [eventType, setEventType] = useState<string>(() => props.eventType ?? SAMPLE_TIMELINE_AUDIT_QUERY.value);
    const [selectedRowId, setSelectedRowId] = useState<number>();
    const auditQueries = useMemo(() => getAuditQueries(moduleContext), [moduleContext]);
    const selectedQuery = useMemo(() => auditQueries.find(q => q.value === eventType), [auditQueries, eventType]);
    const id = useMemo<string>(
        () => (selectedQuery ? `audit-log-querymodel-${selectedQuery.value}` : undefined),
        [selectedQuery]
    );
    const model = queryModels[id];
    const lastSelectedId = useMemo<number>(() => {
        if (!model?.selections) return undefined;
        return parseInt(Array.from(model.selections).pop(), 10);
    }, [model?.selections]);

    useEffect(() => {
        if (props.eventType) {
            setEventType(props.eventType);
        }
    }, [props.eventType]);

    useEffect(() => {
        if (!selectedQuery) return undefined;
        const { value } = selectedQuery;

        if (!queryModels[id]) {
            // Issue 47512: App audit log filters out container events for deleted containers
            const baseFilters: Filter.IFilter[] = [];
            if (PROJECT_AUDIT_QUERY.value === value) {
                baseFilters.push(Filter.create('projectId', project.id));
            }

            actions.addModel(
                {
                    baseFilters,
                    // only bind first model to URL so that it can pick up any filters passed from the caller
                    bindURL: Object.keys(queryModels).length === 0,
                    containerFilter: selectedQuery.containerFilter,
                    id,
                    includeTotalCount: true,
                    schemaQuery: new SchemaQuery(SCHEMAS.AUDIT_TABLES.SCHEMA, value),
                },
                true,
                true
            );
        }
    }, [actions, id, project, queryModels, selectedQuery]);

    useEffect(() => {
        setSelectedRowId(lastSelectedId);
        setDetail(detail_ => (lastSelectedId === detail_?.rowId ? detail_ : undefined));
    }, [lastSelectedId]);

    useEffect(() => {
        if (!lastSelectedId || selectedQuery?.hasDetail !== true) return;

        (async () => {
            try {
                const { value } = selectedQuery;
                const isQueryDataUpdate = value === SOURCE_AUDIT_QUERY.value || value === DATACLASS_DATA_UPDATE_AUDIT_QUERY.value;
                const auditEventType = isQueryDataUpdate ? DATA_UPDATE_AUDIT_QUERY.value : value;
                const detail_ = await getAuditDetail(lastSelectedId, auditEventType);
                setDetail(detail_.merge({ rowId: lastSelectedId }) as AuditDetailsModel);
                setError(undefined);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load audit details');
            }
        })();
    }, [lastSelectedId, selectedQuery]);

    const onSelectionChange = useCallback<SelectInputChange>(
        (_, eventType_) => {
            setEventType(eventType_);
            setSelectedRowId(undefined);
            onChange(eventType_);
        },
        [onChange]
    );

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

    const hasDetailView = selectedQuery?.hasDetail === true;
    const title = 'Audit Logs';

    return (
        <Page hasHeader title={title}>
            <PageHeader title={title} />
            <SelectInput
                inputClass="col-xs-6"
                key="audit-log-query-select"
                name="audit-log-query-select"
                onChange={onSelectionChange}
                options={auditQueries}
                placeholder="Select an audit event type..."
                value={eventType}
            />
            {hasDetailView && model && (
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
            )}
            {!hasDetailView && model && <GridPanel actions={actions} model={model} />}
        </Page>
    );
});

const AuditQueriesListingPageWithModels = withQueryModels<OwnProps>(AuditQueriesListingPageImpl);

export const AuditQueriesListingPage: FC<WithRouterProps> = memo(({ location }) => {
    const onChange = useCallback(eventType => {
        const location_ = getLocation();
        const paramUpdates = location_.query.map((value: string, key: string) => {
            if (key.startsWith('query')) {
                return undefined; // get rid of filtering parameters that are likely not applicable to this new audit log
            } else if (key === AUDIT_EVENT_TYPE_PARAM) {
                return eventType;
            } else {
                return value;
            }
        });
        replaceParameters(location_, paramUpdates);
    }, []);

    return <AuditQueriesListingPageWithModels eventType={location.query?.eventType} onChange={onChange} />;
});
