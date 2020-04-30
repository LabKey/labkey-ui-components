/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { List } from 'immutable';

import { getLocation } from '../..';

import { createGridModel, getLocationString, loadLineageIfNeeded } from './actions';
import { LineageGridDisplay } from './LineageGridDisplay';
import { Lineage, LineagePageModel } from './models';
import { DEFAULT_LINEAGE_DIRECTION, DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_GRID_COLUMNS } from './Tag';

interface Props {
    lsid?: string;
}

interface State {
    model: LineagePageModel;
}

export class LineageGrid extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            model: new LineagePageModel(),
        };
    }

    componentDidMount() {
        this.init();
    }

    componentWillReceiveProps(nextProps: Props) {
        const location = getLocation();
        if (location && this.state.model.lastLocation !== getLocationString(location) && location.query.get('seeds')) {
            this.init();
        }
    }

    init() {
        const location = getLocation();
        const distance = location.query.has('distance') ? location.query.get('distance') : DEFAULT_LINEAGE_DISTANCE;

        this.setGridLoading();
        loadLineageIfNeeded(this.getSeed(), distance).then(lineage => {
            if (lineage.error) {
                this.setGridError(lineage);
            } else {
                this.setGridSuccess(lineage, distance);
            }
        });
    }

    getSeed(): string {
        return this.props.lsid ? this.props.lsid : this.getSeedFromParam();
    }

    getSeedFromParam(): string {
        // TODO this doesn't handle multiple seeds at the moment
        const location = getLocation();
        const seeds = location.query.get('seeds');

        return seeds ? decodeURIComponent(seeds.split(',')[0]) : undefined;
    }

    setGridLoading() {
        const { model } = this.state;
        const newModel = model.set('lastLocation', getLocationString(getLocation()));

        this.setState(() => ({
            model: newModel.mergeIn(['grid'], {
                isLoaded: false,
                isLoading: true,
            }) as LineagePageModel,
        }));
    }

    setGridError(lineage: Lineage) {
        this.setState(state => ({
            model: state.model.mergeIn(['grid'], {
                isError: true,
                isLoaded: false,
                isLoading: false,
                message: lineage.error,
            }) as LineagePageModel,
        }));
    }

    setGridSuccess(lineage: Lineage, distance: number) {
        const location = getLocation();
        const members = location.query.has('members') ? location.query.get('members') : DEFAULT_LINEAGE_DIRECTION;
        const pageNumber = location.query.has('p') ? parseInt(location.query.get('p')) : 1;

        this.setState(state => ({
            model: state.model.merge({
                grid: createGridModel(lineage, members, distance, LINEAGE_GRID_COLUMNS, pageNumber),
                seeds: List(this.getSeed()),
                members,
                distance,
            }) as LineagePageModel,
        }));
    }

    render() {
        return <LineageGridDisplay model={this.state.model.grid} />;
    }
}
