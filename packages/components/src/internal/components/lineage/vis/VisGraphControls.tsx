/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { Network } from 'vis-network';

import { DropdownButton, MenuItem } from '../../../dropdowns';
import { Icon } from '../../../Icon';

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
                            <button className="btn btn-default" onClick={this.props.onToggleSettings} type="button">
                                <i className="fa fa-gear" />
                            </button>
                        )}
                        <DropdownButton title={<i className="fa fa-undo" />} pullRight>
                            <MenuItem onClick={this.resetSelect}>Reset view and select seed</MenuItem>
                            <MenuItem onClick={this.reset}>Reset view</MenuItem>
                        </DropdownButton>
                    </div>
                </div>
                <div className="lineage-visgraph-control-zoom">
                    <div className="btn-group">
                        <button className="btn btn-default" onClick={this.zoomOut} type="button">
                            <Icon iconClass="fa fa-search-minus" srText="Zoom out" />
                        </button>
                        <button className="btn btn-default" onClick={this.zoomIn} type="button">
                            <Icon iconClass="fa fa-search-plus" srText="Zoom in" />
                        </button>
                    </div>
                </div>
                <div className="lineage-visgraph-control-pan">
                    <button
                        className="lineage-visgraph-control-pan-up btn btn-default"
                        onClick={this.panUp}
                        type="button"
                    >
                        <Icon iconClass="fa fa-arrow-up" srText="Pan up" />
                    </button>
                    <div className="btn-group">
                        <button className="btn btn-default" onClick={this.panLeft} type="button">
                            <Icon iconClass="fa fa-arrow-left" srText="Pan left" />
                        </button>
                        <button className="btn btn-default" onClick={this.panDown} type="button">
                            <Icon iconClass="fa fa-arrow-down" srText="Pan down" />
                        </button>
                        <button className="btn btn-default" onClick={this.panRight} type="button">
                            <Icon iconClass="fa fa-arrow-right" srText="Pan right" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
