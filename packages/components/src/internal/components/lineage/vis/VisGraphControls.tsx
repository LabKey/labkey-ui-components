import React, { PureComponent, ReactNode } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';
import { Network } from 'vis-network';

interface GraphControlsProps {
    getNetwork: () => Network;
    onReset: (selectSeed) => any;
}

export class VisGraphControls extends PureComponent<GraphControlsProps> {
    graphReset = (selectSeed: boolean): void => {
        if (this.props.onReset) {
            this.props.onReset(selectSeed);
        }
    };

    panDown = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: -20 } });
    };

    panUp = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: 20 } });
    };

    panLeft = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 20, y: 0 } });
    };

    panRight = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: -20, y: 0 } });
    };

    zoomIn = (): void => {
        const network = this.props.getNetwork();
        network.moveTo({
            scale: network.getScale() + 0.05,
        });
    };

    zoomOut = (): void => {
        const network = this.props.getNetwork();
        const scale = network.getScale() - 0.05;
        if (scale > 0) {
            network.moveTo({ scale });
        }
    };

    render(): ReactNode {
        return (
            <div className="lineage-visgraph-controls">
                <div className="lineage-visgraph-control-settings">
                    <div className="btn-group">
                        <DropdownButton id="graph-control-dd" title={<i className="fa fa-undo" />} pullRight>
                            <MenuItem onClick={() => this.graphReset(true)}>Reset view and select seed</MenuItem>
                            <MenuItem onClick={() => this.graphReset(false)}>Reset view</MenuItem>
                        </DropdownButton>
                    </div>
                </div>
                <div className="lineage-visgraph-control-zoom">
                    <div className="btn-group">
                        <Button onClick={this.zoomOut}>
                            <i className="fa fa-search-minus" />
                        </Button>
                        <Button onClick={this.zoomIn}>
                            <i className="fa fa-search-plus" />
                        </Button>
                    </div>
                </div>
                <div className="lineage-visgraph-control-pan">
                    <Button className="lineage-visgraph-control-pan-up" onClick={this.panUp}>
                        <i className="fa fa-arrow-up" />
                    </Button>
                    <div className="btn-group">
                        <Button onClick={this.panLeft}>
                            <i className="fa fa-arrow-left" />
                        </Button>
                        <Button onClick={this.panDown}>
                            <i className="fa fa-arrow-down" />
                        </Button>
                        <Button onClick={this.panRight}>
                            <i className="fa fa-arrow-right" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
