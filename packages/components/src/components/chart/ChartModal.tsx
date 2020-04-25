import React, { PureComponent } from 'react';

import { Modal } from 'react-bootstrap';

import { QueryGridModel } from '../base/models/model';
import { DataViewInfo } from '../../models';

import { Chart } from './Chart';

interface ChartModalProps {
    selectedChart: DataViewInfo;
    model: QueryGridModel;
    onHide: Function;
}

export class ChartModal extends PureComponent<ChartModalProps> {
    render() {
        const { selectedChart, model, onHide } = this.props;
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
                    <Chart chart={selectedChart} model={model} />
                </Modal.Body>
            </Modal>
        );
    }
}
