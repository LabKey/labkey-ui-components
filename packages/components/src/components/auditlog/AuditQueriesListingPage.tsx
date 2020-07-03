/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
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
} from '../..';

import { AuditDetails } from './AuditDetails';
import { AuditDetailsModel } from './models';
import { getAuditDetail } from './actions';
import { getAuditQueries } from './utils';

const AUDIT_QUERIES = getAuditQueries();

interface Props {
    params: any;
    user: User;
}

interface State {
    selected: string;
    selectedRowId: number;
    detail?: AuditDetailsModel;
    error?: React.ReactNode;
}

export class AuditQueriesListingPage extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            selected: props.params.query,
            selectedRowId: undefined,
        };
    }

    componentDidMount() {
        this.setLastSelectedId();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        if (this.props.params.query !== undefined && prevProps.params.query !== this.props.params.query) {
            this.onSelectionChange(null, this.props.params.query);
        }

        this.setLastSelectedId();
    }

    onSelectionChange = (id, selected) => {
        resetParameters(); // get rid of filtering parameters that are likely not applicable to this new audit log
        this.setState(() => ({ selected, selectedRowId: undefined }));
    };

    setLastSelectedId() {
        if (!this.hasDetailView()) return;

        const model = this.getQueryGridModel();

        // if the model has already loaded selections, we can use that to reselect the last row
        // otherwise, query the server for the selection key for this model and use that response (issue 39374)
        if (model.selectedLoaded) {
            this.updateSelectedRowId(this.getLastSelectedId());
        } else {
            getSelected(model.getId(), model.schema, model.query, model.getFilters(), model.containerPath).then(
                response => {
                    const selectedId =
                        response.selected.length > 0 ? parseInt(List.of(...response.selected).last()) : undefined;
                    this.updateSelectedRowId(selectedId);
                }
            );
        }
    }

    getLastSelectedId(): number {
        const model = this.getQueryGridModel();
        const selectedIds = model.selectedIds;
        return selectedIds.size > 0 ? parseInt(selectedIds.last()) : undefined;
    }

    onRowSelectionChange = (model, row, checked) => {
        let selectedRowId;

        if (checked) {
            selectedRowId = this.getLastSelectedId();
        }

        this.updateSelectedRowId(selectedRowId);
    };

    updateSelectedRowId(selectedRowId: number) {
        if (this.state.selectedRowId !== selectedRowId) {
            this.setState(
                () => ({ selectedRowId, detail: undefined }),
                () => {
                    if (selectedRowId) {
                        getAuditDetail(
                            selectedRowId,
                            this.state.selected === 'sourcesauditevent' ? 'queryupdateauditevent' : this.state.selected
                        )
                            .then(detail => {
                                detail = detail.merge({ rowId: selectedRowId }) as AuditDetailsModel;
                                this.setState(() => ({
                                    detail,
                                }));
                            })
                            .catch(error => {
                                console.error(error);
                                this.setState(() => ({
                                    error,
                                }));
                            });
                    }
                }
            );
        }
    }

    getContainerFilter(): Query.ContainerFilter {
        const selectedQuery = List.of(...AUDIT_QUERIES).find(query => query.value === this.state.selected);
        return selectedQuery ? selectedQuery.containerFilter : undefined;
    }

    hasDetailView(): boolean {
        const { selected } = this.state;
        if (!selected) {
            return false;
        }
        const selectedQuery = List.of(...AUDIT_QUERIES).find(query => query.value === selected);
        return selectedQuery && selectedQuery.hasDetail === true;
    }

    getQueryGridModel(): QueryGridModel {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = getStateQueryGridModel('audit-log-' + selected, SchemaQuery.create('auditLog', selected), {
            containerFilter: this.getContainerFilter(),
            isPaged: true,
        });
        return getQueryGridModel(model.getId()) || model;
    }

    renderSingleGrid() {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = this.getQueryGridModel();
        if (!model) return null;

        return <QueryGridPanel model={model} />;
    }

    renderDetailsPanel() {
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
    }

    renderMasterDetailGrid() {
        const { selected } = this.state;
        if (!selected) {
            return null;
        }

        const model = this.getQueryGridModel();
        if (!model) return null;

        return (
            <>
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
            </>
        );
    }

    getDetailsGridData(): List<Map<string, any>> {
        const { detail } = this.state;
        if (!detail) return null;

        const { eventUserId, eventDateFormatted } = detail;

        let rows = [];
        if (eventUserId) {
            rows.push({ field: detail.getActionLabel() + ' By', value: eventUserId, isUser: true });
        }

        if (eventDateFormatted) {
            rows.push({ field: 'Date', value: eventDateFormatted });
        }

        return fromJS(rows);
    }

    render() {
        const title = 'Audit Log';

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
                    valueKey="value"
                    labelKey="label"
                    onChange={this.onSelectionChange}
                    options={AUDIT_QUERIES}
                />
                {this.hasDetailView() ? this.renderMasterDetailGrid() : this.renderSingleGrid()}
            </Page>
        );
    }
}
