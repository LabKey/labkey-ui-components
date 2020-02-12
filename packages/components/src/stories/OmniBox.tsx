/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import { SearchAction } from '../components/omnibox/actions/Search';
import { FilterAction } from '../components/omnibox/actions/Filter';
import { SortAction } from '../components/omnibox/actions/Sort';
import { createMockActionContext } from '../test/OmniboxMock';
import './stories.scss';
import { OmniBox } from '../components/omnibox/OmniBox';
import { Grid } from '../components/base/Grid';
import { ViewAction } from '../components/omnibox/actions/View';

const { model, resolveColumns, resolveModel } = createMockActionContext('toyStory');

storiesOf('Omnibox', module)
    .addDecorator(withKnobs)
    .add('search (only)', () => {
        const actions = [new SearchAction(undefined, 'q')];

        return (
            <>
                <OmniBox actions={actions} placeholder="Search the data..." />
                <Grid data={model.getData()} />
            </>
        );
    })
    .add('filter (only)', () => {
        const actions = [new FilterAction(resolveColumns, 'f', resolveModel)];

        return (
            <>
                <OmniBox actions={actions} placeholder="Filter the data..." />
                <Grid data={model.getData()} />
            </>
        );
    })
    .add('sort (only)', () => {
        const actions = [new SortAction(resolveColumns, 's')];

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
            new SortAction(resolveColumns, 's'),
            new ViewAction(resolveColumns, 'v', resolveModel),
        ];

        return (
            <>
                <OmniBox actions={actions} placeholder="Do all the things..." />
                <Grid data={model.getData()} />
            </>
        );
    });
