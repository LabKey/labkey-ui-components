/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';
import { Link, WithRouterProps } from 'react-router';
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
} from '../../..';

export class QueryListingPage extends Component<WithRouterProps> {
    componentDidMount = (): void => {
        this.initModel();
    };

    componentDidUpdate = (prevProps: Readonly<WithRouterProps>): void => {
        if (prevProps.location?.pathname !== this.props.location?.pathname) {
            this.initModel();
        }
    };

    initModel = (): void => {
        gridInit(this.getQueryGridModel(), true, this);
    };

    getQueryGridModel = (): QueryGridModel => {
        const { location, params } = this.props;
        const { schema, query } = params;

        const model = getStateQueryGridModel('querylisting', SchemaQuery.create(schema, query), () => ({
            containerFilter: Query.ContainerFilter[location.query.containerFilter as string],
            isPaged: true,
        }));
        return getQueryGridModel(model.getId()) || model;
    };

    render = (): ReactNode => {
        const model = this.getQueryGridModel();
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
    };
}
