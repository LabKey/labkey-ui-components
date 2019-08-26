/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import { Link } from 'react-router';
import { Media, Image, Panel, Modal } from 'react-bootstrap'
import { Set } from 'immutable';
import { IReportItem, ReportTypes } from '../model';
import { LoadingSpinner, SchemaQuery, AppURL } from '@glass/base';
import { PreviewGrid } from '@glass/querygrid';

const GRID_REPORTS = Set([ReportTypes.Query, ReportTypes.Dataset]);
const CHARTS = Set([ReportTypes.AutomaticPlot, ReportTypes.XYScatterPlot, ReportTypes.TimeChart]);

interface ReportConsumer {
    report: IReportItem,
}

interface ReportItemModalProps extends ReportConsumer{
    onClose?(): void,
}

class UnsupportedReportBody extends React.PureComponent<ReportConsumer> {
    render() {
        const { description, runUrl, type, createdBy } = this.props.report;

        return (
            <Modal.Body>
                <div className="alert alert-warning report-list__unsupported-preview">
                    <div className="unsupported-icon">
                        <span className="fa fa-exclamation-circle">&nbsp;</span>
                    </div>

                    <p>
                        This report is not currently supported. It is recommended that you view the report in LabKey
                        Server.
                    </p>

                    <a href={runUrl} className="btn btn-warning">
                        <span>View in LabKey</span>
                    </a>
                </div>

                <div className="report-item__metadata">
                    <div className="report-item__metadata-item">
                        <label>Created By:</label>
                        <span>{createdBy}</span>
                    </div>

                    <div className="report-item__metadata-item">
                        <label>Type:</label>
                        <span>{type}</span>
                    </div>

                    <div className="report-item__metadata-item">
                        <label>Description:</label>
                        <span>{description}</span>
                    </div>
                </div>
            </Modal.Body>
        );
    }
}

class GridReportBody extends React.PureComponent<ReportConsumer> {
    render () {
        const { schemaName, queryName, viewName, runUrl, appUrl } = this.props.report;
        const schemaQuery = SchemaQuery.create(schemaName, queryName, viewName);
        let appLink;

        if (appUrl) {
            appLink = <p><Link to={appUrl.toString()}>View grid in Biologics</Link></p>;
        }

        return (
            <Modal.Body>
                <div className="report-list_grid_preview">
                    <div>
                        <p><a href={runUrl}>View grid in LabKey Server</a></p>
                        {appLink}
                    </div>
                    <PreviewGrid schemaQuery={schemaQuery} numCols={4} numRows={3} />
                </div>
            </Modal.Body>
        );
    }
}

export class ReportItemModal extends React.PureComponent<ReportItemModalProps> {
    render() {
        const { name, type } = this.props.report;
        const onClose = this.props.onClose;
        let BodyRenderer = UnsupportedReportBody;

        if (GRID_REPORTS.contains(type as ReportTypes)) {
            BodyRenderer = GridReportBody;
        } else if (CHARTS.contains(type as ReportTypes)) {
            // TODO: Set body renderer to visualization renderer.
        }

        return (
            <div className="report-item-modal">
                <Modal show onHide={onClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>{name}</Modal.Title>
                    </Modal.Header>

                    <BodyRenderer report={this.props.report} />
                </Modal>
            </div>
        );
    }
}

interface ReportListItemProps {
    report: IReportItem,
    onClick(IReportItem): void,
}

export class ReportListItem extends React.PureComponent<ReportListItemProps> {
    onClick = () => this.props.onClick(this.props.report);

    render() {
        const { name, icon, iconCls, createdBy } = this.props.report;
        let createdByEl;
        let iconEl = <Image className="report-list-item__icon" src={icon} />;

        if (iconCls) {
            iconEl = <span className={`report-list-item__icon ${iconCls} fa-4x`} />
        }

        if (createdBy) {
            createdByEl = <p className="report-list-item__person">Created by: {createdBy}</p>;
        }

        return (
            <Media.ListItem className="report-list-item" onClick={this.onClick}>
                <Media.Left>
                    {iconEl}
                </Media.Left>

                <Media.Body>
                    <Media.Heading className="report-list-item__name">{name}</Media.Heading>
                    {createdByEl}
                </Media.Body>
            </Media.ListItem>
        );
    }
}

export interface ReportListProps {
    loading: boolean,
    reports: Array<IReportItem>,
    onReportClicked(report: IReportItem): void,
}

export class ReportList extends React.PureComponent<ReportListProps> {
    render() {
        const { loading, reports, onReportClicked } = this.props;

        let body: any;

        if (loading) {
            body = (
                <div className="report-list__message">
                    <LoadingSpinner />
                </div>
            );
        } else if (reports.length === 0) {
            body = <div className="report-list__message">No reports.</div>;
        } else {
            const reportEls = reports.map((report: IReportItem) => {
                return <ReportListItem key={report.runUrl} report={report} onClick={onReportClicked} />;
            });

            body = (
                <Media.List className="report-list__list">
                    {reportEls}
                </Media.List>
            );
        }

        return (
            <Panel>
                <div className="report-list">
                    {body}
                </div>
            </Panel>
        );
    }
}
