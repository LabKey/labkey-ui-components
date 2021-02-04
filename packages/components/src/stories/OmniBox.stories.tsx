/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { PureComponent } from 'react';
import { fromJS, List } from 'immutable';
import { Query } from '@labkey/api';
import { Meta, Story } from '@storybook/react/types-6-0';

import { Grid, LoadingSpinner, QueryColumn, QueryGridModel, QueryInfo } from '..';

import { SearchAction } from '../internal/components/omnibox/actions/Search';
import { FilterAction } from '../internal/components/omnibox/actions/Filter';
import { SortAction } from '../internal/components/omnibox/actions/Sort';
import { OmniBox } from '../internal/components/omnibox/OmniBox';
import { ViewAction } from '../internal/components/omnibox/actions/View';
import { makeQueryInfo, makeTestData } from '../internal/testHelpers';

import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQuery.json';

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

    getSelectDistinctOptions = (column: string): Query.SelectDistinctOptions => {
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
        };
    };

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

export default {
    title: 'Components/OmniBox',
    component: OmniBoxRenderer,
    parameters: {
        controls: {
            disabled: true,
        },
    },
} as Meta;

const OmniBoxStory: Story = storyProps => <OmniBoxRenderer {...(storyProps as any)} />;

export const Search = OmniBoxStory.bind({});
Search.storyName = 'Search (only)';

Search.args = {
    actions: ['search'],
    placeholder: 'Search the data...',
};

export const Filter = OmniBoxStory.bind({});
Filter.storyName = 'Filter (only)';

Filter.args = {
    actions: ['filter'],
    placeholder: 'Filter the data...',
};

export const Sort = OmniBoxStory.bind({});
Sort.storyName = 'Sort (only)';

Sort.args = {
    actions: ['sort'],
    placeholder: 'Sort the data...',
};

export const All = OmniBoxStory.bind({});
All.storyName = 'All actions';

All.args = {
    actions: ['search', 'filter', 'sort', 'view'],
    placeholder: 'Do all the things...',
};
