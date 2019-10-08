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
import { createMockActionContext } from '../test/OmniboxMock';
import './stories.scss';

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