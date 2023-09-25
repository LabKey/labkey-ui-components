/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PureComponent, ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { Filter, getServerContext } from '@labkey/api';

import { WithRouterProps } from 'react-router';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { GridPanel } from '../../../public/QueryModel/GridPanel';

import { User } from '../base/models/User';
import { getLocation, replaceParameters } from '../../util/URL';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Page } from '../base/Page';
import { PageHeader } from '../base/PageHeader';
import { SelectInput } from '../forms/input/SelectInput';
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { ModuleContext, useServerContext } from '../base/ServerContext';

import { SCHEMAS } from '../../schemas';

import { getAuditQueries } from './utils';
import { getAuditDetail } from './actions';
import { AuditDetailsModel } from './models';
import { AuditDetails } from './AuditDetails';
import {
    AuditQuery,
    AUDIT_EVENT_TYPE_PARAM,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    DATA_UPDATE_AUDIT_QUERY,
    PROJECT_AUDIT_QUERY,
} from './constants';

interface BodyProps {
    moduleContext: ModuleContext;
    user: User;
}

type Props = BodyProps & InjectedQueryModels & WithRouterProps;

interface State {
    auditQueries: AuditQuery[];
    detail?: AuditDetailsModel;
    error?: ReactNode;
    selected: string;
    selectedRowId: number;
}

class AuditQueriesListingPageImpl extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            auditQueries: getAuditQueries(props.moduleContext),
            selected: props.location.query?.eventType ?? SAMPLE_TIMELINE_AUDIT_QUERY.value,
            selectedRowId: undefined,
        };
    }

    componentDidMount = (): void => {
        this.setLastSelectedId();
    };

    componentDidUpdate = (prevProps: Readonly<Props>): void => {
        const { eventType } = this.props.location?.query;
        if (eventType !== undefined && eventType !== prevProps.location.query?.eventType) {
            this.onSelectionChange(null, eventType);
        }

        this.setLastSelectedId();
    };

    onSelectionChange = (_: any, selected: string): void => {
        const location = getLocation();
        const paramUpdates = location.query.map((value: string, key: string) => {
            if (key.startsWith('query')) {
                return undefined; // get rid of filtering parameters that are likely not applicable to this new audit log
            } else if (key === AUDIT_EVENT_TYPE_PARAM) {
                return selected;
            } else {
                return value;
            }
        });
        replaceParameters(location, paramUpdates);
        this.setState({ selected, selectedRowId: undefined });
    };

    setLastSelectedId = async (): Promise<void> => {
        if (!this.hasDetailView()) return;

        const model = this.getQueryModel();
        if (!model) return;

        // if the model has already loaded selections, we can use that to reselect the last row
        if (!model.isLoadingSelections) {
            this.updateSelectedRowId(this.getLastSelectedId());
        }
    };

    getLastSelectedId = (): number => {
        const model = this.getQueryModel();
        if (!model) return undefined;
        const selectedIds = model.selections;
        return selectedIds.size > 0 ? parseInt(Array.from(selectedIds).pop(), 10) : undefined;
    };

    updateSelectedRowId = (selectedRowId: number): void => {
        const { selected } = this.state;
        if (this.state.selectedRowId === selectedRowId) return;

        this.setState({ selectedRowId, detail: undefined }, async () => {
            if (selectedRowId) {
                try {
                    const auditEventType =
                        selected === SOURCE_AUDIT_QUERY.value ? DATA_UPDATE_AUDIT_QUERY.value : selected;
                    const detail = await getAuditDetail(selectedRowId, auditEventType);

                    this.setState({
                        detail: detail.merge({ rowId: selectedRowId }) as AuditDetailsModel,
                    });
                } catch (error) {
                    this.setState({ error });
                }
            }
        });
    };

    get selectedQuery(): AuditQuery {
        const { auditQueries, selected } = this.state;
        if (!selected) return undefined;
        return auditQueries.find(q => q.value === selected);
    }

    hasDetailView(): boolean {
        return this.state.selected && this.selectedQuery?.hasDetail === true;
    }

    getQueryModel = (): QueryModel => {
        const { queryModels, actions } = this.props;
        const { selected } = this.state;
        if (!selected) return undefined;

        const id = `audit-log-querymodel-${selected}`;

        if (!queryModels[id]) {
            // Issue 47512: App audit log filters out container events for deleted containers
            const baseFilters: Filter.IFilter[] = [];
            if (PROJECT_AUDIT_QUERY.value === selected) {
                baseFilters.push(Filter.create('projectId', getServerContext().project.id));
            }

            actions.addModel(
                {
                    baseFilters,
                    // only bind first model to URL so that it can pick up any filters passed from the caller
                    bindURL: Object.keys(queryModels).length === 0,
                    containerFilter: this.selectedQuery?.containerFilter,
                    id,
                    includeTotalCount: true,
                    schemaQuery: new SchemaQuery(SCHEMAS.AUDIT_TABLES.SCHEMA, selected),
                    useSavedSettings: true,
                },
                true,
                true
            );
        }

        return queryModels[id];
    };

    getDetailsGridData = (): List<Map<string, any>> => {
        const { detail } = this.state;
        if (!detail) return null;

        const { eventUserId, eventDateFormatted, userComment } = detail;

        const rows = [];
        if (eventUserId) {
            rows.push({ field: detail.getActionLabel() + ' By', value: eventUserId, isUser: true });
        }

        if (eventDateFormatted) {
            rows.push({ field: 'Date', value: eventDateFormatted });
        }

        if (userComment) {
            rows.push({ field: 'User Comment', value: userComment });
        }

        return fromJS(rows);
    };

    render = (): ReactNode => {
        const title = 'Audit Logs';
        const { actions, user } = this.props;
        const { auditQueries, detail, error, selected, selectedRowId } = this.state;
        const hasDetailView = this.hasDetailView();
        const model = this.getQueryModel();

        return (
            <Page hasHeader title={title}>
                <PageHeader title={title} />
                <SelectInput
                    inputClass="col-xs-6"
                    key="audit-log-query-select"
                    name="audit-log-query-select"
                    onChange={this.onSelectionChange}
                    options={auditQueries}
                    placeholder="Select an audit event type..."
                    value={selected}
                />
                {hasDetailView && model && (
                    <Row>
                        <Col xs={12} md={8}>
                            <GridPanel actions={actions} highlightLastSelectedRow model={model} />
                        </Col>
                        <Col xs={12} md={4}>
                            {error && <Alert>{error}</Alert>}
                            {selectedRowId && !detail && !error && <LoadingSpinner />}
                            {selectedRowId && detail && !error && (
                                <AuditDetails
                                    changeDetails={detail}
                                    gridData={this.getDetailsGridData()}
                                    rowId={selectedRowId}
                                    summary={detail.comment}
                                    user={user}
                                />
                            )}
                        </Col>
                    </Row>
                )}
                {!hasDetailView && model && <GridPanel actions={actions} model={model} />}
            </Page>
        );
    };
}

const AuditQueriesListingPageWithQueryModels = withQueryModels<BodyProps & WithRouterProps>(
    AuditQueriesListingPageImpl
);

export const AuditQueriesListingPage: FC<WithRouterProps> = props => {
    const { moduleContext, user } = useServerContext();
    return <AuditQueriesListingPageWithQueryModels {...props} moduleContext={moduleContext} user={user} />;
};
