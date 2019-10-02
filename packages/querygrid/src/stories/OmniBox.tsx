/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';
import { fromJS, List, Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { Grid, QueryColumn, QueryGridModel } from '@glass/base';

import { OmniBox } from '..';
import { FilterAction, SearchAction, SortAction } from '..';
import rawColumnData from '../test/data/columns.json';
import rawData from '../test/data/data.json';
import './stories.scss';

export interface IActionContext {
    columns: List<QueryColumn>
    columnsByName: Map<string, QueryColumn>
    model: QueryGridModel
    resolveColumns: () => Promise<List<QueryColumn>>
    resolveModel: () => Promise<QueryGridModel>
}

export const createMockActionContext = (dataKey: string): IActionContext => {
    const columns = List<QueryColumn>(rawColumnData[dataKey].columns.map(col => QueryColumn.create(col)));
    const columnsByName = columns.reduce((map, col) => map.set(col.name, col), Map<string, QueryColumn>());
    const data = fromJS(rawData[dataKey]);

    const model = new QueryGridModel({
        dataIds: data.keySeq().toList(),
        data
    });

    return {
        columns,
        columnsByName,
        model,
        resolveColumns: (): Promise<List<QueryColumn>> => Promise.resolve(columns),
        resolveModel: (): Promise<QueryGridModel> => Promise.resolve(model)
    }
};

const { model, resolveColumns, resolveModel } = createMockActionContext('toyStory');

storiesOf("Omnibox", module)
    .addDecorator(withKnobs)
    .add("search (only)", () => {
        const actions = [
            new SearchAction(undefined, 'q')
        ];

        return (
            <>
                <OmniBox actions={actions} placeholder="Search the data..." />
                <Grid data={model.getData()} />
            </>
        );
    })
    .add("filter (only)", () => {
        const actions = [
            new FilterAction(resolveColumns, 'f', resolveModel)
        ];

        return (
            <>
                <OmniBox actions={actions} placeholder="Filter the data..." />
                <Grid data={model.getData()} />
            </>
        );
    })
    .add("sort (only)", () => {
        const actions = [
            new SortAction(resolveColumns, 's')
        ];

        return (
            <>
                <OmniBox actions={actions} placeholder="Sort the data..." />
                <Grid data={model.getData()} />
            </>
        );
    })
    .add('All actions', () => {
        const actions = [
            new SearchAction(undefined, 'q'),
            new FilterAction(resolveColumns, 'f', resolveModel),
            new SortAction(resolveColumns, 's')
        ];

        return (
            <>
                <OmniBox actions={actions} placeholder="Do all the things..." />
                <Grid data={model.getData()} />
            </>
        );
    });