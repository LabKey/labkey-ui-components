/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Link } from 'react-router';
import { Query } from '@labkey/api';

import {
    getStateQueryGridModel,
    gridInit,
    QueryGridModel,
    SchemaQuery,
    getQueryGridModel,
    Page,
    Breadcrumb,
    PageHeader,
    AppURL,
    QueryGridPanel,
    Location,
} from '../../..';

interface OwnProps {
    params: any;
    location: Location;
}

export class QueryListingPage extends React.Component<OwnProps, any> {
    componentWillMount() {
        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: OwnProps) {
        this.initModel(nextProps);
    }

    initModel(props: OwnProps) {
        const model = this.getQueryGridModel(props);
        gridInit(model, true, this);
    }

    getQueryGridModel(props: OwnProps): QueryGridModel {
        const { schema, query } = props.params;
        const { containerFilter } = props.location.query;

        const model = getStateQueryGridModel('querylisting', SchemaQuery.create(schema, query), {
            containerFilter: Query.ContainerFilter[containerFilter],
            isPaged: true,
        });
        return getQueryGridModel(model.getId()) || model;
    }

    render() {
        const model = this.getQueryGridModel(this.props);
        const queryInfo = model.queryInfo;

        const schemaTitle = queryInfo ? queryInfo.schemaLabel : model.schema;
        const title = queryInfo ? queryInfo.queryLabel : model.query;

        return (
            <Page title={'Query - ' + schemaTitle + '.' + title} hasHeader={true}>
                {queryInfo !== undefined && (
                    <Breadcrumb>
                        <Link to={AppURL.create('q').toString()}>Schemas</Link>
                        <Link to={AppURL.create('q', queryInfo.schemaName).toString()}>{schemaTitle}</Link>
                    </Breadcrumb>
                )}
                <PageHeader title={title} />
                <QueryGridPanel model={model} />
            </Page>
        );
    }
}
