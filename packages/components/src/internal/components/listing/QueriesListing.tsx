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
import React, { Component, ReactNode } from 'react';
import { fromJS, List } from 'immutable';
import { Query } from '@labkey/api';

import { GridColumn } from '../base/models/GridColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { AppURL } from '../../url/AppURL';
import { naturalSortByProperty } from '../../../public/sort';
import { Grid } from '../base/Grid';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { SchemaListing } from './SchemaListing';

interface QueryData extends Query.GetQueryResponse {
    schemaName: string;
}

const columns = List([
    new GridColumn({
        index: 'name',
        title: 'Name',
        cell: (name: string, info: QueryInfo) => {
            if (name && info) {
                return <a href={AppURL.create('q', info.schemaName, info.name).toHref()}>{info.title}</a>;
            }
            return name;
        },
    }),
    new GridColumn({
        index: 'description',
        title: 'Description',
    }),
]);

function fetchQueryInfos(schemaName: string): Promise<QueryData[]> {
    return new Promise((resolve, reject) => {
        Query.getQueries({
            schemaName,
            success: data => {
                const queries = data.queries
                    .map(result => ({ ...result, schemaName }))
                    .sort(naturalSortByProperty('name'));

                resolve(queries);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

interface QueriesListingProps {
    asPanel?: boolean;
    hideEmpty?: boolean;
    schemaName: string;
    title?: string;
}

interface QueriesListingState {
    error: string;
    queries: QueryData[];
}

export class QueriesListing extends Component<QueriesListingProps, QueriesListingState> {
    static defaultProps = {
        title: 'Queries',
    };

    constructor(props: QueriesListingProps) {
        super(props);

        this.state = {
            queries: undefined,
            error: undefined,
        };
    }

    componentDidMount = (): void => {
        this.loadQueries();
    };

    componentDidUpdate = (prevProps: Readonly<QueriesListingProps>): void => {
        if (prevProps.schemaName !== this.props.schemaName) {
            this.loadQueries();
        }
    };

    loadQueries = (): void => {
        const { schemaName } = this.props;
        fetchQueryInfos(schemaName)
            .then(queries => {
                this.setState({ queries });
            })
            .catch(error => {
                this.setState({ error: error.exception });
            });
    };

    render = (): ReactNode => {
        const { schemaName, hideEmpty, asPanel, title } = this.props;
        const { queries, error } = this.state;

        if (queries) {
            return (
                <>
                    <SchemaListing schemaName={schemaName} hideEmpty asPanel title="Nested Schemas" />
                    {hideEmpty && queries.length === 0 ? null : asPanel ? (
                        <div className="panel panel-default">
                            <div className="panel-heading">{title}</div>
                            <div className="panel-body">
                                <Grid data={fromJS(queries)} columns={columns} />
                            </div>
                        </div>
                    ) : (
                        <Grid data={fromJS(queries)} columns={columns} />
                    )}
                </>
            );
        }

        if (error) {
            return <Alert>{error}</Alert>;
        }

        return <LoadingSpinner />;
    };
}
