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
import * as React from "react";
import $ from 'jquery'
import { Media, Image, Panel, Modal } from 'react-bootstrap'
import { generateId, LoadingSpinner, VisualizationConfigModel, getVisualizationConfig, DataViewInfo } from '@glass/base'

interface ReportItemModalProps {
    report: DataViewInfo,
    onClose(): void,
}

interface State {
    divId: string
    config: VisualizationConfigModel
}

export class ReportItemModal extends React.PureComponent<ReportItemModalProps, State> {
    constructor(props: ReportItemModalProps) {
        super(props);

        this.state = {
            divId: generateId('chart-'),
            config: undefined
        };
    }

    componentDidMount() {
        this.getChartConfig();
    }

    getChartConfig() {
        if (this.props.report.isVisChartType()) {
            getVisualizationConfig(this.props.report.reportId)
                .then((config) => {
                    this.setState({config});
                    this.renderChart();
                })
                .catch(response => {
                    // TODO this.renderError(response.exception);
                });
        }
    }

    getPlotElement() {
        return $('#' + this.state.divId);
    }

    renderChart() {
        let { config } = this.state;

        if (config) {
            let newConfig = config.toJS();

            // set the size of the SVG based on the plot el width (i.e. the model width)
            newConfig.chartConfig.width = this.getPlotElement().width();
            newConfig.chartConfig.height = newConfig.chartConfig.width * 9 / 16; // 16:9 aspect ratio

            this.getPlotElement().html('');
            LABKEY.vis.GenericChartHelper.renderChartSVG(this.state.divId, newConfig.queryConfig, newConfig.chartConfig);
        }
    }

    render() {
        const { report } = this.props;
        const { name, description, runUrl, type, thumbnail, createdBy } = report;
        const onClose = this.props.onClose;

        return (
            <div className="report-item-modal">
                <Modal show onHide={onClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>{name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <p>
                            <a href={runUrl}>View report Definition <span className="fa fa-external-link"/></a>
                        </p>

                        <p>
                            <strong>Created By:</strong> {createdBy}
                        </p>

                        <p>
                            <strong>Type:</strong> {type}
                        </p>

                        <p>
                            <strong>Description:</strong> {description}
                        </p>

                        {report.isVisChartType()
                            ? <div id={this.state.divId}><LoadingSpinner/></div>
                            : <Image src={thumbnail}/>
                        }
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}

interface ReportListItemProps {
    report: DataViewInfo,
    onClick(IReportItem): void,
}

export class ReportListItem extends React.PureComponent<ReportListItemProps> {
    onClick = () => this.props.onClick(this.props.report);

    onLinkClicked = (e) => {
        // We need to stop event propagation when clicking on a link or it will also trigger the onClick handler
        e.stopPropagation();
        return true;
    };

    render() {
        const { name, runUrl, icon, iconCls, createdBy } = this.props.report;
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

                <Media.Right align="middle">
                    <a href={runUrl} className="report-list-item__external-link" onClick={this.onLinkClicked}>
                        <span className="fa fa-external-link" />
                    </a>
                </Media.Right>
            </Media.ListItem>
        );
    }
}

export interface ReportListProps {
    loading: boolean,
    reports: Array<DataViewInfo>,
    onReportClicked(report: DataViewInfo): void,
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
            const reportEls = reports.map((report: DataViewInfo) => {
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
