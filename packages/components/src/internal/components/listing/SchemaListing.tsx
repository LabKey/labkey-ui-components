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
import { Link } from 'react-router';
import { List, Map } from 'immutable';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { SchemaDetails } from '../base/models/model';
import { AppURL } from '../../../url/AppURL';
import { Grid, GridColumn } from '../base/Grid';
import { fetchSchemas } from '../base/models/schemas';

const columns = List([
    new GridColumn({
        index: 'schemaName',
        title: 'Schema',
        cell: (schemaName: string, details: SchemaDetails) => {
            if (details) {
                return (
                    <Link className="text-capitalize" to={AppURL.create('q', details.fullyQualifiedName).toString()}>
                        {schemaName}
                    </Link>
                );
            }

            return <span className="text-capitalize">{schemaName}</span>;
        },
    }),
    new GridColumn({
        index: 'description',
        title: 'Description',
    }),
]);

interface SchemaListingProps {
    schemaName?: string;
    hideEmpty?: boolean;
    asPanel?: boolean;
    title?: string;
}

interface SchemaListingState {
    schemas: List<Map<string, SchemaDetails>>;
}

export class SchemaListing extends Component<SchemaListingProps, SchemaListingState> {
    static defaultProps = {
        title: 'Schemas',
    };

    constructor(props: SchemaListingProps) {
        super(props);

        this.state = {
            schemas: undefined,
        };
    }

    componentDidMount = (): void => {
        this.loadSchemas();
    };

    componentDidUpdate = (prevProps: Readonly<SchemaListingProps>): void => {
        if (prevProps.schemaName !== this.props.schemaName) {
            this.loadSchemas();
        }
    };

    loadSchemas = (): void => {
        fetchSchemas(this.props.schemaName).then(schemas => {
            this.setState({ schemas });
        });
    };

    render = (): ReactNode => {
        const { hideEmpty, asPanel, title } = this.props;
        const { schemas } = this.state;

        if (schemas) {
            if (hideEmpty && schemas.count() === 0) {
                return null;
            }

            const grid = <Grid data={schemas} columns={columns} />;

            if (asPanel) {
                return (
                    <div className="panel panel-default">
                        <div className="panel-heading">{title}</div>
                        <div className="panel-body">{grid}</div>
                    </div>
                );
            }

            return grid;
        }

        return <LoadingSpinner />;
    };
}
