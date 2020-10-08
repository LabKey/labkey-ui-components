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
import React, { PureComponent } from 'react';
import { Link } from 'react-router';
import { Image, Media, Modal, Panel } from 'react-bootstrap';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { PreviewGrid } from '../PreviewGrid';
import { Chart } from '../chart/Chart';
import { LoadingSpinner } from '../../..';
import { SVGIcon } from '../../..';
import { SchemaQuery } from '../../..';
import { Alert } from '../../..';
import { DataViewInfo, IDataViewInfo } from '../../models';
import { DataViewInfoTypes, GRID_REPORTS, VISUALIZATION_REPORTS } from '../../constants';

const ICONS = {
    [DataViewInfoTypes.AutomaticPlot]: 'xy_line',
    [DataViewInfoTypes.BarChart]: 'bar_chart',
    [DataViewInfoTypes.BoxAndWhiskerPlot]: 'box_plot',
    [DataViewInfoTypes.Dataset]: 'custom_grid',
    [DataViewInfoTypes.PieChart]: 'pie_chart',
    [DataViewInfoTypes.Query]: 'custom_grid',
    [DataViewInfoTypes.SampleComparison]: 'sample_comparison',
    [DataViewInfoTypes.TimeChart]: 'xy_line',
    [DataViewInfoTypes.XYScatterPlot]: 'xy_scatter',
    [DataViewInfoTypes.XYSeriesLinePlot]: 'xy_line',
};

interface ReportConsumer {
    report: IDataViewInfo;
}

interface ReportItemModalProps extends ReportConsumer {
    onClose?(): void;
}

class ReportLinks extends PureComponent<ReportConsumer> {
    render() {
        const { runUrl, appUrl } = this.props.report;
        let appLink;

        if (appUrl) {
            appLink = (
                <p>
                    <Link to={appUrl.toString()}>View in Biologics</Link>
                </p>
            );
        }

        return (
            <div className="report-item__links">
                <p>
                    <a href={runUrl}>View in LabKey Server</a>
                </p>
                {appLink}
            </div>
        );
    }
}

class ReportMetadata extends PureComponent<ReportConsumer> {
    render() {
        const { description, type, createdBy } = this.props.report;

        return (
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
        );
    }
}

class UnsupportedReportBody extends PureComponent<ReportConsumer> {
    render() {
        return (
            <div className="report-list__unsupported-preview">
                <div className="alert alert-warning unsupported-alert">
                    <div className="unsupported-alert__icon">
                        <span className="fa fa-exclamation-circle" />
                    </div>

                    <p className="unsupported-alert__message">
                        This report is not currently supported. It is recommended that you view the report in LabKey
                        Server.
                    </p>

                    <div className="unsupported-alert__view-link">
                        <a href={this.props.report.runUrl} className="btn btn-warning">
                            View in LabKey
                        </a>
                    </div>
                </div>

                <ReportMetadata report={this.props.report} />
            </div>
        );
    }
}

class GridReportBody extends PureComponent<ReportConsumer> {
    render() {
        const { schemaName, queryName, viewName, runUrl, appUrl } = this.props.report;
        const schemaQuery = SchemaQuery.create(schemaName, queryName, viewName);

        return (
            <div className="report-list__grid-preview">
                <ReportLinks report={this.props.report} />

                <PreviewGrid schemaQuery={schemaQuery} numCols={4} numRows={3} />

                <ReportMetadata report={this.props.report} />
            </div>
        );
    }
}

class ChartReportBody extends PureComponent<ReportConsumer, any> {
    render() {
        return (
            <div className="report-list__chart-preview">
                <ReportLinks report={this.props.report} />

                <Chart chart={new DataViewInfo(this.props.report)} />

                <ReportMetadata report={this.props.report} />
            </div>
        );
    }
}

interface SampleComparisonState {
    loading?: boolean;
    report?: any;
    error?: string;
}

class SampleComparisonReportBody extends PureComponent<ReportConsumer, SampleComparisonState> {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            report: null,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchReport();
    }

    getReportId = () => {
        const { report } = this.props;
        return report.reportId.replace('db:', '');
    };

    fetchReport = () => {
        const id = this.getReportId();
        this.setState({ loading: true });

        Ajax.request({
            url: ActionURL.buildURL('assayreport', 'get.api'),
            params: { id },
            method: 'GET',
            success: Utils.getCallbackWrapper(data => {
                this.setState({ loading: false, report: data.data });
            }),
            failure: Utils.getCallbackWrapper(error => {
                this.setState({ loading: false, error: 'Error loading Sample Comparison Report' });
            }),
        });
    };

    render() {
        const { runUrl, appUrl } = this.props.report;
        const { loading, report, error } = this.state;
        const container = ActionURL.getContainer();
        const id = this.getReportId();
        const editUrl = ActionURL.buildURL('assayreport', 'edit', container, { id });
        let body = <LoadingSpinner msg="Loading report definition..." />;

        if (!loading && report) {
            const columns = report.config.selectedColumns;
            const numColumns = columns.length;
            const uniqueAssays = columns.reduce((result, column) => {
                if (column.schemaName) {
                    const schema = column.schemaName.join('/');
                    result[schema] = true;
                }
                return result;
            }, {});
            const numAssays = Object.keys(uniqueAssays).length;
            body = (
                <div>
                    This report includes {numColumns} columns from {numAssays} assays.
                </div>
            );
        } else if (error) {
            body = <Alert bsStyle="danger">{this.state.error}</Alert>;
        }

        return (
            <div className="report-list__scr-preview">
                <div className="report-item__links">
                    <p>
                        <a href={runUrl}>View in LabKey Server</a>
                    </p>
                    <p>
                        <a href={editUrl}>Edit in LabKey Server</a>
                    </p>
                    <p>
                        <Link to={appUrl.toString()}>View in Biologics</Link>
                    </p>
                </div>

                <div>{body}</div>

                <ReportMetadata report={this.props.report} />
            </div>
        );
    }
}

export class ReportItemModal extends PureComponent<ReportItemModalProps> {
    render() {
        const { name, type } = this.props.report;
        const onClose = this.props.onClose;
        let BodyRenderer = UnsupportedReportBody;

        if (GRID_REPORTS.contains(type as DataViewInfoTypes)) {
            BodyRenderer = GridReportBody;
        } else if (VISUALIZATION_REPORTS.contains(type as DataViewInfoTypes)) {
            BodyRenderer = ChartReportBody;
        } else if (type === DataViewInfoTypes.SampleComparison) {
            BodyRenderer = SampleComparisonReportBody;
        }

        return (
            <div className="report-item-modal">
                <Modal show onHide={onClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>{name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <BodyRenderer report={this.props.report} />
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}

interface ReportListItemProps {
    report: IDataViewInfo;
    onClick(IDataViewInfo): void;
}

export class ReportListItem extends PureComponent<ReportListItemProps> {
    onClick = () => this.props.onClick(this.props.report);

    onLinkClicked = e => {
        // We need to stop event propagation when clicking on a link or it will also trigger the onClick handler
        e.stopPropagation();
        return true;
    };

    render() {
        const { name, icon, iconCls, createdBy, type, runUrl, appUrl } = this.props.report;
        let nameEl = (
            <a href={runUrl} onClick={this.onLinkClicked}>
                {name}
            </a>
        );

        if (appUrl) {
            nameEl = (
                <Link to={appUrl.toString()} onClick={this.onLinkClicked}>
                    {name}
                </Link>
            );
        }

        const iconSrc = ICONS[type];
        const iconClassName = 'report-list-item__icon';
        const hasCustomIcon = icon.indexOf('reports-thumbnail.view') > -1;
        let iconEl = <Image className={iconClassName} src={icon} />;

        if (iconSrc !== undefined && !hasCustomIcon) {
            iconEl = <SVGIcon className={iconClassName} height={null} iconDir="_images" iconSrc={iconSrc} />;
        } else if (iconCls) {
            iconEl = <span className={`${iconClassName} ${iconCls} fa-4x`} />;
        }

        let createdByEl;

        if (createdBy) {
            createdByEl = <p className="report-list-item__person">Created by: {createdBy}</p>;
        }

        return (
            <Media.ListItem className="report-list-item" onClick={this.onClick}>
                <Media.Left>{iconEl}</Media.Left>

                <Media.Body>
                    <Media.Heading className="report-list-item__name">{nameEl}</Media.Heading>
                    {createdByEl}
                </Media.Body>
            </Media.ListItem>
        );
    }
}

export interface ReportListProps {
    loading: boolean;
    reports: IDataViewInfo[];
    onReportClicked(report: IDataViewInfo): void;
}

export class ReportList extends PureComponent<ReportListProps> {
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
            const reportEls = reports.map((report: IDataViewInfo) => {
                return <ReportListItem key={report.runUrl} report={report} onClick={onReportClicked} />;
            });

            body = <Media.List className="report-list__list">{reportEls}</Media.List>;
        }

        return (
            <Panel>
                <div className="report-list">{body}</div>
            </Panel>
        );
    }
}
