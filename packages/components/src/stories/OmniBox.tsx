/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import { fromJS } from 'immutable';

import { SearchAction } from '../components/omnibox/actions/Search';
import { FilterAction } from '../components/omnibox/actions/Filter';
import { SortAction } from '../components/omnibox/actions/Sort';
import './stories.scss';
import { OmniBox } from '../components/omnibox/OmniBox';
import { Grid } from '../components/base/Grid';
import { ViewAction } from '../components/omnibox/actions/View';
import { makeQueryInfo, makeTestData } from '../testHelpers';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import { LoadingSpinner, QueryGridModel } from '..';

interface Props {
    actions: string[];
    placeholder: string;
}

interface State {
    model: QueryGridModel;
    actions: any[];
}

class OmniBoxRenderer extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            model: undefined,
            actions: undefined,
        };
    }

    componentDidMount(): void {
        // Need to load data here so we run makeQueryInfo after initQueryGridState has been called.
        makeTestData(mixturesQuery).then(mockData => {
            const queryInfo = makeQueryInfo(mixturesQueryInfo);
            const model = new QueryGridModel({
                queryInfo,
                schema: queryInfo.schemaQuery.schemaName,
                query: queryInfo.schemaQuery.queryName,
                view: queryInfo.schemaQuery.viewName,
                messages: fromJS(mockData.messages),
                data: fromJS(mockData.rows),
                dataIds: fromJS(mockData.orderedRows),
                totalRows: mockData.rowCount,
            });
            const getModel = () => model;
            const actions = this.props.actions.map(action => {
                switch (action) {
                    case 'search':
                        return new SearchAction('q');
                    case 'sort':
                        return new SortAction('s', getModel);
                    case 'filter':
                        return new FilterAction('f', getModel);
                    case 'view':
                        return new ViewAction('v', getModel);
                }
            });

            this.setState({
                model,
                actions,
            });
        });
    }

    render() {
        const { actions, model } = this.state;

        if (!model) {
            return <LoadingSpinner />;
        }

        return (
            <div className="omnibox-renderer">
                <OmniBox getModel={() => model} actions={actions} placeholder={this.props.placeholder} />
                <Grid data={model.getData()} />
            </div>
        );
    }
}

storiesOf('Omnibox', module)
    .addDecorator(withKnobs)
    .add('search (only)', () => {
        return <OmniBoxRenderer actions={['search']} placeholder="Search the data..." />;
    })
    .add('filter (only)', () => {
        return <OmniBoxRenderer actions={['filter']} placeholder="Filter the data..." />;
    })
    .add('sort (only)', () => {
        return <OmniBoxRenderer actions={['sort']} placeholder="Sort the data..." />;
    })
    .add('All actions', () => {
        return <OmniBoxRenderer actions={['search', 'filter', 'sort', 'view']} placeholder="Do all the things..." />;
    });
