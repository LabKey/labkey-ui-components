/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { fromJS, List } from 'immutable'
import { Grid, QueryColumn, QueryGridModel } from '@glass/base'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import { OmniBox } from '../OmniBox'
import { FilterAction, SearchAction, SortAction } from '..'

import './stories.scss'

const allColumns = List([
    QueryColumn.create({
        name: 'height',
        jsonType: 'int',
        shortCaption: 'Height'
    }),
    QueryColumn.create({
        name: 'name',
        jsonType: 'string',
        shortCaption: 'Name'
    }),
    QueryColumn.create({
        name: 'phrase',
        jsonType: 'string',
        shortCaption: 'Phrase'
    })
]);

const data = fromJS({
    0: {
        height: {
            displayValue: '20 cm',
            value: 20
        },
        name: {
            displayValue: 'Sheriff Woody',
            value: 'woody'
        },
        phrase: {
            value: 'I\'ve got a snake in my boot!'
        }
    },
    1: {
        height: {
            displayValue: '16 cm',
            value: 16
        },
        name: {
            displayValue: 'Buzz Lightyear',
            value: 'buzz'
        },
        phrase: {
            value: 'To infinity and beyond!'
        }
    }
});

const model = new QueryGridModel({
    dataIds: data.keySeq().toList(),
    data
});

const resolveColumns = (): Promise<List<QueryColumn>> => {
    return Promise.resolve(allColumns);
};

const resolveModel = (): Promise<QueryGridModel> => {
    return Promise.resolve(model);
};

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