import * as React from "react";
import { Media, Image, Panel, Modal } from 'react-bootstrap'
import { IReportItem } from "../model";
import { LoadingSpinner } from '@glass/base'

interface ReportItemModalProps {
    report: IReportItem,
    onClose(): void,
}

export class ReportItemModal extends React.PureComponent<ReportItemModalProps> {
    render() {
        const { name, description, runUrl, type, thumbnail, createdBy } = this.props.report;
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

                        <Image src={thumbnail}/>
                    </Modal.Body>
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
