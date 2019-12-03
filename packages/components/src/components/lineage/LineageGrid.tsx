/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn';
import { List } from 'immutable';

import { createGridModel, getLocationString, loadLineageIfNeeded } from './actions';
import { LineageGridDisplay } from './LineageGridDisplay';
import { Lineage, LineagePageModel } from './models';
import { getLocation } from '../../util/URL';
import { DEFAULT_LINEAGE_DIRECTION, DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_GRID_COLUMNS } from './Tag';

interface Props {
    lsid?: string
}

interface State {
    model: LineagePageModel
}

export class LineageGrid extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            model: new LineagePageModel()
        }
    }

    componentWillMount() {
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

        // the getLocation() does decodeURI on each query param, but the lineage API expects them encoded
        return seeds ? encodeURI(seeds.split(",")[0]) : undefined;
    }

    setGridLoading() {
        const { model } = this.state;
        const newModel = model.set('lastLocation', getLocationString(getLocation()));

        this.setState(() => ({
            model: newModel.mergeIn(['grid'], {
                isLoaded: false,
                isLoading: true
            }) as LineagePageModel
        }));
    }

    setGridError(lineage: Lineage) {
        this.setState((state) => ({
            model: state.model.mergeIn(['grid'], {
                isError: true,
                isLoaded: false,
                isLoading: false,
                message: lineage.error
            }) as LineagePageModel
        }));
    }

    setGridSuccess(lineage: Lineage, distance: number) {
        const location = getLocation();
        const members = location.query.has('members') ? location.query.get('members') : DEFAULT_LINEAGE_DIRECTION;
        const pageNumber = location.query.has('p') ? parseInt(location.query.get('p')) : 1;

        this.setState((state) => ({
            model: state.model.merge({
                grid: createGridModel(lineage, members, distance, LINEAGE_GRID_COLUMNS, pageNumber),
                seeds: List(this.getSeed()),
                members,
                distance
            }) as LineagePageModel
        }));
    }

    getLineage(): Lineage {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lineageResults.get(this.getSeed());
    }

    render() {
        return <LineageGridDisplay model={this.state.model.grid}/>
    }
}
