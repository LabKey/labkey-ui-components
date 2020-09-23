/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { Draft, produce } from 'immer';

import { Location } from '../../../..';

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
            model: produce(prevState.model, (draft: Draft<LineageGridModel>) => {
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

export interface LineageGridFromLocationProps {
    location: Location;
}

export class LineageGridFromLocation extends PureComponent<LineageGridFromLocationProps> {
    ensureNumber(value: string): number {
        const numValue = parseInt(value);
        return isNaN(numValue) ? undefined : numValue;
    }

    render(): ReactNode {
        const { query } = this.props.location;

        return (
            <LineageGrid
                distance={this.ensureNumber(query.get('distance'))}
                lsid={query.get('seeds') ? decodeURIComponent(query.get('seeds').split(',')[0]) : undefined}
                members={query.get('members')}
                pageNumber={this.ensureNumber(query.get('p'))}
            />
        );
    }
}
