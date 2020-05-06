/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { PureComponent } from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { fromJS, List } from 'immutable';
// TODO: open PR to export ISelectDistinctOptions from api-js
import { ISelectDistinctOptions } from '@labkey/api/dist/labkey/query/SelectDistinctRows';


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
import { LoadingSpinner, QueryColumn, QueryGridModel, QueryInfo } from '..';

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
            const actions = this.props.actions.map(action => {
                switch (action) {
                    case 'search':
                        return new SearchAction('q');
                    case 'sort':
                        return new SortAction('s', this.getColumns);
                    case 'filter':
                        return new FilterAction('f', this.getColumns);
                    case 'view':
                        return new ViewAction('v', this.getColumns, this.getQueryInfo);
                }
            });

            this.setState({
                model,
                actions,
            });
        });
    }

    getSelectDistinctOptions = (column: string): ISelectDistinctOptions => {
        const model = this.state.model;
        return {
            column,
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: model.schema,
            queryName: model.query,
            viewName: model.view,
            filterArray: model.getFilters().toJS(),
            parameters: model.queryParameters,
        }
    }

    getColumns = (all?): List<QueryColumn> => {
        const { model } = this.state;
        return all ? model.getAllColumns() : model.getDisplayColumns();
    };

    getQueryInfo = (): QueryInfo => {
        return this.state.model.queryInfo;
    };

    render() {
        const { actions, model } = this.state;

        if (!model) {
            return <LoadingSpinner />;
        }

        return (
            <div className="omnibox-renderer">
                <OmniBox
                    getColumns={this.getColumns}
                    getSelectDistinctOptions={this.getSelectDistinctOptions}
                    actions={actions}
                    placeholder={this.props.placeholder}
                />
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
