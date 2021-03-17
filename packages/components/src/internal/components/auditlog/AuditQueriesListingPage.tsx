/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { Query } from '@labkey/api';

import {
    getSelected,
    getStateQueryGridModel,
    QueryGridModel,
    resetParameters,
    SchemaQuery,
    User,
    getQueryGridModel,
    QueryGridPanel,
    Alert,
    LoadingSpinner,
    Page,
    PageHeader,
    SelectInput,
} from '../../..';

import { AuditDetails } from './AuditDetails';
import { AuditDetailsModel } from './models';
import { getAuditDetail } from './actions';
import { AuditQuery, getAuditQueries } from './utils';

interface Props {
    params: any;
    user: User;
}

interface State {
    selected: string;
    selectedRowId: number;
    auditQueries: AuditQuery[];
    detail?: AuditDetailsModel;
    error?: ReactNode;
}

export class AuditQueriesListingPage extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            selected: props.params.query,
            selectedRowId: undefined,
            auditQueries: getAuditQueries()
        };
    }

    componentDidMount = (): void => {
        this.setLastSelectedId();
    };

    componentDidUpdate = (prevProps: Readonly<Props>): void => {
        const { query } = this.props.params;
        if (query !== undefined && query !== prevProps.params.query) {
            this.onSelectionChange(null, query);
        }

        this.setLastSelectedId();
    };

    onSelectionChange = (_: any, selected: string): void => {
        resetParameters(); // get rid of filtering parameters that are likely not applicable to this new audit log
        this.setState(() => ({ selected, selectedRowId: undefined }));
    };

    setLastSelectedId = async (): Promise<void> => {
        if (!this.hasDetailView()) return;

        const model = this.getQueryGridModel();

        // if the model has already loaded selections, we can use that to reselect the last row
        // otherwise, query the server for the selection key for this model and use that response (issue 39374)
        if (model.selectedLoaded) {
            this.updateSelectedRowId(this.getLastSelectedId());
        } else {
            const response = await getSelected(
                model.getId(),
                model.schema,
                model.query,
                model.getFilters(),
                model.containerPath,
                model.queryParameters
            );
            const selectedId = response.selected.length > 0 ? parseInt(response.selected.slice(-1)[0], 10) : undefined;
            this.updateSelectedRowId(selectedId);
        }
    };

    getLastSelectedId = (): number => {
        const model = this.getQueryGridModel();
        const selectedIds = model.selectedIds;
        return selectedIds.size > 0 ? parseInt(selectedIds.last()) : undefined;
    };

    onRowSelectionChange = (model, row, checked): void => {
        let selectedRowId;

        if (checked) {
            selectedRowId = this.getLastSelectedId();
        }

        this.updateSelectedRowId(selectedRowId);
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

    getQueryGridModel = (): QueryGridModel => {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = getStateQueryGridModel('audit-log-' + selected, SchemaQuery.create('auditLog', selected), () => ({
            containerFilter: this.containerFilter,
            isPaged: true,
        }));
        return getQueryGridModel(model.getId()) || model;
    };

    renderSingleGrid = (): ReactNode => {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = this.getQueryGridModel();
        if (!model) return null;

        return <QueryGridPanel model={model} />;
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
                hasUserField={true}
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

        const model = this.getQueryGridModel();
        if (!model) return null;

        return (
            <Row>
                <Col xs={12} md={8}>
                    <QueryGridPanel
                        onSelectionChange={this.onRowSelectionChange}
                        highlightLastSelectedRow={true}
                        model={model}
                    />
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

        const { eventUserId, eventDateFormatted } = detail;

        const rows = [];
        if (eventUserId) {
            rows.push({ field: detail.getActionLabel() + ' By', value: eventUserId, isUser: true });
        }

        if (eventDateFormatted) {
            rows.push({ field: 'Date', value: eventDateFormatted });
        }

        return fromJS(rows);
    };

    render = (): ReactNode => {
        const title = 'Audit Log';
        const { auditQueries } = this.state;

        return (
            <Page title={title} hasHeader={true}>
                <PageHeader title={title} />
                <SelectInput
                    key="audit-log-query-select"
                    name="audit-log-query-select"
                    placeholder="Select an audit event type..."
                    inputClass="col-xs-6"
                    formsy={false}
                    showLabel={false}
                    multiple={false}
                    required={false}
                    value={this.state.selected}
                    onChange={this.onSelectionChange}
                    options={auditQueries}
                />
                {this.hasDetailView() ? this.renderMasterDetailGrid() : this.renderSingleGrid()}
            </Page>
        );
    };
}
