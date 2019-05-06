/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Link } from 'react-router'
import { List, Map } from 'immutable'
import { AppURL, Grid, GridColumn, SchemaDetails, LoadingSpinner } from '@glass/base'

import { fetchSchemas } from "../../query/schemas";

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
        }
    }),
    new GridColumn({
        index: 'description',
        title: 'Description'
    })
]);

interface SchemaListingProps {
    schemaName?: string
    hideEmpty?: boolean
    asPanel?: boolean
    title?: string
}

interface SchemaListingState {
    schemas: List<Map<string, SchemaDetails>>
}

export class SchemaListing extends React.Component<SchemaListingProps, SchemaListingState> {

    constructor(props: SchemaListingProps) {
        super(props);

        this.state = {
            schemas: undefined
        }
    }

    componentWillMount() {
        const { schemaName } = this.props;
        this.loadSchemas(schemaName);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.schemaName !== nextProps.schemaName) {
            this.loadSchemas(nextProps.schemaName);
        }
    }

    loadSchemas(schemaName: string) {
        fetchSchemas(schemaName).then((schemas) => {
            this.setState(() => ({schemas}));
        });
    }

    render() {
        const { hideEmpty, asPanel, title } = this.props;
        const { schemas } = this.state;

        if (schemas) {
            if (hideEmpty && schemas.count() === 0) {
                return null;
            }

            if (asPanel) {
                return (
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            {title || 'Schemas'}
                        </div>
                        <div className="panel-body">
                            <SchemaListingDisplay schemas={schemas}/>
                        </div>
                    </div>
                )
            }

            return <SchemaListingDisplay schemas={schemas}/>;
        }

        return <LoadingSpinner/>;
    }
}


interface SchemaListingDisplayProps {
    schemas: List<Map<string, SchemaDetails>>
}

export class SchemaListingDisplay extends React.PureComponent<SchemaListingDisplayProps, any> {

    render() {
        const { schemas } = this.props;
        return <Grid data={schemas} columns={columns}/>;
    }
}