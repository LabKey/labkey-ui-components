import * as React from "react";
import { Media, Image, Panel, Modal } from 'react-bootstrap'
import { IReportItem } from "../model";
import { LoadingSpinner } from '@glass/utils'

interface ReportItemModalProps {
    report: IReportItem,
    onClose(): void,
}

export class ReportItemModal extends React.PureComponent<ReportItemModalProps> {
    render() {
        const { name, description, detailsUrl, type, thumbnail, createdBy } = this.props.report;
        const onClose = this.props.onClose;

        return (
            <div className="report-item-modal">
                <Modal show onHide={onClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>{name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <p>
                            <a href={detailsUrl}>View report Definition <span className="fa fa-external-link"/></a>
                        </p>

                        <p>
                            Created By: {createdBy}
                        </p>

                        <p>
                            Type: {type}
                        </p>

                        <p>
                            Description: {description}
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

    render() {
        const { name, detailsUrl, icon, iconCls, createdBy } = this.props.report;
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

                <Media.Body className="report-list-item__body">
                    <Media.Heading className="report-list-item__name">{name}</Media.Heading>
                    {createdByEl}
                </Media.Body>

                <Media.Right align="middle">
                    <a href={detailsUrl} className="report-list-item__external-link">
                        <span className="fa fa-external-link" />
                    </a>
                </Media.Right>
            </Media.ListItem>
        );
    }
}

interface ReportListProps {
    loading: boolean,
    reports: Array<IReportItem>,
    onReportClicked(report: IReportItem): void,
}

export class ReportList extends React.PureComponent<ReportListProps> {
    render() {
        const { loading, reports, onReportClicked } = this.props;

        let body: any;

        if (loading) {
            body = <LoadingSpinner />;
        } else if (reports.length === 0) {
            body = <div>No reports avaialable.</div>;
        } else {
            body = reports.map((report: IReportItem) => {
                return <ReportListItem key={report.detailsUrl} report={report} onClick={() => onReportClicked(report)} />;
            });
        }

        return (
            <Panel>
                <div className="report-list">
                    <Media.List className="report-list__list">
                        {body}
                    </Media.List>
                </div>
            </Panel>
        );
    }
}

export default ReportList;
