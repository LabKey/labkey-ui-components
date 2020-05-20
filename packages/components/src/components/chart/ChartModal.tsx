import React, { PureComponent } from 'react';
import { Modal } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { DataViewInfo } from '../../models';

import { Chart } from './Chart';

interface ChartModalProps {
    selectedChart: DataViewInfo;
    filters: Filter.IFilter[];
    onHide: Function;
}

export class ChartModal extends PureComponent<ChartModalProps> {
    render() {
        const { selectedChart, filters, onHide } = this.props;
        let description;

        if (selectedChart.description) {
            description = (
                <div>
                    <br />
                    {selectedChart.description}
                </div>
            );
        }

        return (
            <Modal bsSize="large" show={selectedChart !== undefined} keyboard={true} onHide={onHide}>
                <Modal.Header closeButton={true} closeLabel="Close">
                    <Modal.Title>{selectedChart.getLabel()}</Modal.Title>

                    {description}
                </Modal.Header>

                <Modal.Body>
                    <Chart chart={selectedChart} filters={filters} />
                </Modal.Body>
            </Modal>
        );
    }
}
