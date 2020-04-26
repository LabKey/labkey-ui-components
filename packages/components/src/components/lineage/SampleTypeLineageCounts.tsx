/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FunctionComponent, PureComponent } from 'react';
import { List } from 'immutable';
import { Alert, Grid, GridColumn, LoadingSpinner } from '../..';

import { InjectedLineage, withLineage } from './withLineage';

interface State {
    columns: List<GridColumn>;
}

class CountsWithLineageImpl extends PureComponent<InjectedLineage, State> {

    readonly state: State = {
        columns: List([
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
        ]),
    };

    render() {
        const { lineage } = this.props;
        const { columns } = this.state;

        if (!lineage || !lineage.isLoaded()) {
            return <LoadingSpinner />;
        }

        if (lineage.error) {
            return <Alert>{lineage.error}</Alert>;
        }

        return <Grid columns={columns} data={lineage.sampleStats} />;
    }
}

const CountsWithLineage = withLineage<{}>(CountsWithLineageImpl, false, true);

// Don't expose props from withLineage in public component
export const SampleTypeLineageCounts: FunctionComponent<{ seed: string }> = (props)  => {
    return <CountsWithLineage lsid={props.seed} />;
};
