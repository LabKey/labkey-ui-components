/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { Draft, produce } from 'immer';
import { getLocation } from '../../..';

import { createGridModel, getLocationString, loadLineageIfNeeded } from '../actions';
import { LineageGridDisplay } from './LineageGridDisplay';
import { Lineage, LineagePageModel } from '../models';
import { DEFAULT_LINEAGE_DIRECTION, DEFAULT_LINEAGE_DISTANCE } from '../constants';
import { LINEAGE_GRID_COLUMNS } from '../Tag';

interface Props {
    lsid?: string
}

interface State {
    model: LineagePageModel
}

export class LineageGrid extends PureComponent<Props, State> {

    readonly state: State = { model: new LineagePageModel() };

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
        loadLineageIfNeeded(this.getSeed(), distance)
            .then(lineage => {
                if (lineage.error) {
                    this.setGridError(lineage);
                }
                else {
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

        return seeds ? decodeURIComponent(seeds.split(",")[0]) : undefined;
    }

    setGridLoading(): void {
        const newLastLocation = getLocationString(getLocation());

        this.setState(produce((draft: Draft<State>) => {
            draft.model.lastLocation = newLastLocation;
            let { grid } = draft.model;
            grid.isLoaded = false;
            grid.isLoading = true;
        }));
    }

    setGridError(lineage: Lineage): void {
        this.setState(produce((draft: Draft<State>) => {
            let { grid } = draft.model;
            grid.isError = true;
            grid.isLoaded = false;
            grid.isLoading = false;
            grid.message = lineage.error;
        }));
    }

    setGridSuccess(lineage: Lineage, distance: number) {
        const { query } = getLocation();
        const members = query.has('members') ? query.get('members') : DEFAULT_LINEAGE_DIRECTION;
        const pageNumber = query.has('p') ? parseInt(query.get('p')) : 1;

        this.setState(produce((draft: Draft<State>) => {
            let { model } = draft;
            model.distance = distance;
            model.grid = createGridModel(lineage, members, distance, LINEAGE_GRID_COLUMNS, pageNumber);
            model.seeds = [this.getSeed()];
            model.members = members;
        }));
    }

    render() {
        return <LineageGridDisplay model={this.state.model.grid}/>
    }
}
