/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode, useMemo } from 'react';
import { produce } from 'immer';
import { useSearchParams } from 'react-router-dom';
import { Page } from '../../base/Page';
import { PageHeader } from '../../base/PageHeader';

import { createGridModel } from '../actions';
import { LineageGridModel } from '../models';
import { InjectedLineage, withLineage, WithLineageOptions } from '../withLineage';
import { LINEAGE_DIRECTIONS } from '../types';

import { LineageGridDisplay } from './LineageGridDisplay';

interface LineageGridOwnProps extends WithLineageOptions {
    members?: LINEAGE_DIRECTIONS;
    pageNumber?: number;
}

interface LineageGridState {
    model: LineageGridModel;
}

type LineageGridProps = InjectedLineage & LineageGridOwnProps;

class LineageGridImpl extends PureComponent<LineageGridProps, LineageGridState> {
    readonly state: LineageGridState = { model: new LineageGridModel() };

    static getDerivedStateFromProps(nextProps: LineageGridProps, prevState: LineageGridState): LineageGridState {
        const { distance, lineage, members, pageNumber } = nextProps;

        return {
            model: produce<LineageGridModel>(prevState.model, draft => {
                if (lineage?.error) {
                    draft.isError = true;
                    draft.isLoaded = false;
                    draft.isLoading = false;
                    draft.message = lineage.error;
                } else if (!lineage || !lineage.isLoaded()) {
                    draft.isLoaded = false;
                    draft.isLoading = true;
                } else {
                    return createGridModel(lineage, members, distance, pageNumber);
                }
            }),
        };
    }

    render(): ReactNode {
        return <LineageGridDisplay model={this.state.model} />;
    }
}

export const LineageGrid = withLineage(LineageGridImpl, false);

function ensureNumber(value: string): number {
    const numValue = parseInt(value);
    return isNaN(numValue) ? undefined : numValue;
}

export const LineageGridFromLocation: FC = memo(() => {
    const [searchParams, _] = useSearchParams();
    const { distance, members, p, seeds } = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

    return (
        <LineageGrid
            distance={ensureNumber(distance)}
            lsid={seeds ? seeds.split(',')[0] : undefined}
            members={members as LINEAGE_DIRECTIONS}
            pageNumber={ensureNumber(p)}
        />
    );
});

interface PageProps {
    title: string;
}

export const LineagePage: FC<PageProps> = memo(({ title }) => (
    <Page title={title}>
        <PageHeader title={title} />
        <div className="panel panel-default">
            <div className="panel-body">
                <LineageGridFromLocation />
            </div>
        </div>
    </Page>
));
