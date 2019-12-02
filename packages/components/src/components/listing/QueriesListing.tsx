/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react'
import { Link } from 'react-router'
import { List } from 'immutable'

import { SchemaListing } from './SchemaListing';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AppURL } from '../../url/AppURL';
import { Grid, GridColumn } from '../base/Grid';
import { fetchGetQueries } from '../base/models/schemas';
import { QueryInfo } from '../base/models/model';

const columns = List([
    new GridColumn({
        index: 'name',
        title: 'Name',
        cell: (name: string, info: QueryInfo) => {
            if (name && info) {
                return (
                    <Link to={AppURL.create('q', info.schemaName, info.name).toString()}>
                        {info.title}
                    </Link>
                );
            }
            return name;
        }
    }),
    new GridColumn({
        index: 'description',
        title: 'Description'
    })
]);

interface QueriesListingProps {
    schemaName: string
    hideEmpty?: boolean
    asPanel?: boolean
    title?: string
}

interface QueriesListingState {
    queries: List<QueryInfo>
}

export class QueriesListing extends React.Component<QueriesListingProps, QueriesListingState> {

    constructor(props: QueriesListingProps) {
        super(props);

        this.state = {
            queries: undefined
        }
    }

    componentWillMount() {
        const { schemaName } = this.props;
        this.loadQueries(schemaName);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.schemaName !== nextProps.schemaName) {
            this.loadQueries(nextProps.schemaName);
        }
    }

    loadQueries(schemaName: string) {
        fetchGetQueries(schemaName).then((queries) => {
            this.setState(() => ({queries}));
        });
    }

    render() {
        const { schemaName, hideEmpty, asPanel, title } = this.props;
        const { queries } = this.state;

        if (queries) {
            return (
                <>
                    <SchemaListing
                        schemaName={schemaName}
                        hideEmpty={true}
                        asPanel={true}
                        title={'Nested Schemas'}
                    />
                    {hideEmpty && queries.count() === 0
                        ? null
                        : asPanel ?
                            <div className="panel panel-default">
                                <div className="panel-heading">
                                    {title || 'Queries'}
                                </div>
                                <div className="panel-body">
                                    <QueriesListingDisplay queries={queries}/>
                                </div>
                            </div>
                            : <QueriesListingDisplay queries={queries}/>
                    }
                </>
            );
        }

        return <LoadingSpinner/>;
    }
}

interface QueriesListingDisplayProps {
    queries: List<QueryInfo>
}

export class QueriesListingDisplay extends React.Component<QueriesListingDisplayProps, any> {

    render() {
        const { queries } = this.props;
        return <Grid data={queries} columns={columns}/>
    }
}
