import React, { PureComponent, ReactNode } from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';
import { Network } from 'vis-network';

const PAN_INCREMENT = 20;
const ZOOM_INCREMENT = 0.05;

interface GraphControlsProps {
    getNetwork: () => Network;
    onReset: (selectSeed: boolean) => void;
    onToggleSettings: () => void;
}

export class VisGraphControls extends PureComponent<GraphControlsProps> {
    panDown = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: -PAN_INCREMENT } });
    };

    panUp = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: 0, y: PAN_INCREMENT } });
    };

    panLeft = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: PAN_INCREMENT, y: 0 } });
    };

    panRight = (): void => {
        this.props.getNetwork().moveTo({ offset: { x: -PAN_INCREMENT, y: 0 } });
    };

    reset = (): void => {
        this.props.onReset?.(false);
    };

    resetSelect = (): void => {
        this.props.onReset?.(true);
    };

    zoomIn = (): void => {
        const network = this.props.getNetwork();
        network.moveTo({
            scale: network.getScale() + ZOOM_INCREMENT,
        });
    };

    zoomOut = (): void => {
        const network = this.props.getNetwork();
        const scale = network.getScale() - ZOOM_INCREMENT;
        if (scale > 0) {
            network.moveTo({ scale });
        }
    };

    render(): ReactNode {
        return (
            <div className="lineage-visgraph-controls">
                <div className="lineage-visgraph-control-settings">
                    <div className="btn-group">
                        {!!this.props.onToggleSettings && (
                            <Button onClick={this.props.onToggleSettings}>
                                <i className="fa fa-gear" />
                            </Button>
                        )}
                        <DropdownButton id="graph-control-dd" title={<i className="fa fa-undo" />} pullRight>
                            <MenuItem onClick={this.resetSelect}>Reset view and select seed</MenuItem>
                            <MenuItem onClick={this.reset}>Reset view</MenuItem>
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
