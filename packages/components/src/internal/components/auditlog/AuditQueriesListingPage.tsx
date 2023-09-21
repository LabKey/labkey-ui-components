/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PureComponent, ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { Query } from '@labkey/api';

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
import { AuditQuery, AUDIT_EVENT_TYPE_PARAM, SAMPLE_TIMELINE_AUDIT_QUERY } from './constants';

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
            selected: props.location.query?.eventType ?? SAMPLE_TIMELINE_AUDIT_QUERY.value,
            selectedRowId: undefined,
            auditQueries: getAuditQueries(props.moduleContext),
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
        this.setState(() => ({ selected, selectedRowId: undefined }));
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
        const selectedIds = model.selections;
        return selectedIds.size > 0 ? parseInt(Array.from(selectedIds).pop()) : undefined;
    };

    updateSelectedRowId = (selectedRowId: number): void => {
        const { selected } = this.state;

        if (this.state.selectedRowId !== selectedRowId) {
            this.setState({ selectedRowId, detail: undefined }, async () => {
                if (selectedRowId) {
                    try {
                        const auditEventType = selected === 'sourcesauditevent' ? 'queryupdateauditevent' : selected;
                        const detail = await getAuditDetail(selectedRowId, auditEventType);

                        this.setState({
                            detail: detail.merge({ rowId: selectedRowId }) as AuditDetailsModel,
                        });
                    } catch (error) {
                        console.error(error);
                        this.setState({ error });
                    }
                }
            });
        }
    };

    get selectedQuery(): AuditQuery {
        const { auditQueries } = this.state;

        return auditQueries.find(q => q.value === this.state.selected);
    }

    get containerFilter(): Query.ContainerFilter {
        return this.selectedQuery?.containerFilter;
    }

    hasDetailView(): boolean {
        return this.state.selected && this.selectedQuery?.hasDetail === true;
    }

    getQueryModel = (): QueryModel => {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const { queryModels, actions } = this.props;
        const id = 'audit-log-querymodel-' + selected;

        // only bind first model to URL so that it can pick up any filters passed from the caller
        const isFirstModel = Object.keys(queryModels).length === 0;

        if (!queryModels[id]) {
            actions.addModel(
                {
                    id,
                    schemaQuery: new SchemaQuery(SCHEMAS.AUDIT_TABLES.SCHEMA, selected),
                    containerFilter: this.containerFilter,
                    bindURL: isFirstModel,
                    includeTotalCount: true,
                    useSavedSettings: true,
                },
                true,
                true
            );
        }

        return queryModels[id];
    };

    renderSingleGrid = (): ReactNode => {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = this.getQueryModel();
        if (!model) return null;

        return <GridPanel model={model} actions={this.props.actions} />;
    };

    renderDetailsPanel = (): ReactNode => {
        const { user } = this.props;
        const { detail, error, selectedRowId } = this.state;

        if (error) {
            return <Alert bsStyle="danger">{error}</Alert>;
        }

        if (selectedRowId && !detail) return <LoadingSpinner />;

        return (
            <AuditDetails
                rowId={selectedRowId}
                user={user}
                summary={detail ? detail.comment : undefined}
                gridData={this.getDetailsGridData()}
                changeDetails={detail}
            />
        );
    };

    renderMasterDetailGrid = (): ReactNode => {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = this.getQueryModel();
        if (!model) return null;

        return (
            <Row>
                <Col xs={12} md={8}>
                    <GridPanel actions={this.props.actions} model={model} highlightLastSelectedRow={true} />
                </Col>
                <Col xs={12} md={4}>
                    {this.renderDetailsPanel()}
                </Col>
            </Row>
        );
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
        const { auditQueries } = this.state;

        return (
            <Page title={title} hasHeader={true}>
                <PageHeader title={title} />
                <SelectInput
                    key="audit-log-query-select"
                    name="audit-log-query-select"
                    placeholder="Select an audit event type..."
                    inputClass="col-xs-6"
                    value={this.state.selected}
                    onChange={this.onSelectionChange}
                    options={auditQueries}
                />
                {this.hasDetailView() ? this.renderMasterDetailGrid() : this.renderSingleGrid()}
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
