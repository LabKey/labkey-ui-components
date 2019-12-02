/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List } from 'immutable'

import { loadSampleStatsIfNeeded } from './actions';
import { Lineage } from './models';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Grid, GridColumn } from '../base/Grid';
import { Alert } from '../base/Alert';

const columns = List([
    new GridColumn({
        index: 'name',
        title: 'Sample Type'
    }),
    new GridColumn({
        index: 'sampleCount',
        title: 'Number of Samples'
    }),
    new GridColumn({
        index: 'modified',
        title: 'Most Recent (Date)'
    })
]);

interface Props {
    seed: string
}

interface State {
    lineage: Lineage
}

export class SampleTypeLineageCounts extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            lineage: undefined
        }
    }

    componentDidMount() {
        this.init(this.props.seed);
    }

    componentWillReceiveProps(nextProps: Props) {
        if (this.props.seed !== nextProps.seed) {
            this.init(nextProps.seed);
        }
    }

    init(seed: string) {
        loadSampleStatsIfNeeded(seed)
            .then(lineage => {
                this.setState(() => ({lineage}));
            });
    }

    render() {
        const { lineage } = this.state;

        if (!lineage) {
            return <LoadingSpinner/>
        }

        if (lineage.error) {
            return <Alert>{lineage.error}</Alert>
        }

        return (
            <Grid data={lineage.sampleStats} columns={columns}/>
        )
    }
}
