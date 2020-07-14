/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Link } from 'react-router';

import {
    getStateQueryGridModel,
    QueryGridModel,
    SchemaQuery,
    SCHEMAS,
    getQueryGridModel,
    gridInit,
    Page,
    BreadcrumbCreate,
    AppURL,
    PageHeader,
    Detail,
    resolveDetailRenderer,
    LoadingSpinner,
} from '../../..';

interface OwnProps {
    params?: any;
}

export class QueryDetailPage extends React.Component<OwnProps, any> {
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
        const { schema, query, id } = props.params;
        const model = getStateQueryGridModel(
            'querydetail',
            SchemaQuery.create(schema, query),
            {
                allowSelection: false,
                requiredColumns: SCHEMAS.CBMB,
            },
            id
        );

        return getQueryGridModel(model.getId()) || model;
    }

    title(row: any): string {
        const model = this.getQueryGridModel(this.props);
        const queryInfo = model.queryInfo;
        let title: string;

        if (queryInfo) {
            // default to titleColumn
            if (queryInfo.titleColumn && row) {
                title =
                    row.getIn([queryInfo.titleColumn, 'formattedValue']) ||
                    row.getIn([queryInfo.titleColumn, 'displayValue']) ||
                    row.getIn([queryInfo.titleColumn, 'value']);
            }

            // secondary to queryLabel
            if (!title && queryInfo.queryLabel && row) {
                title =
                    row.getIn([queryInfo.queryLabel, 'formattedValue']) ||
                    row.getIn([queryInfo.queryLabel, 'displayValue']) ||
                    row.getIn([queryInfo.queryLabel, 'value']);
            }
        }

        // lastly, just show the id
        if (!title) {
            title = `<${model.keyValue}>`;
        }

        return title;
    }

    render() {
        const model = this.getQueryGridModel(this.props);

        if (model && model.isLoaded) {
            const queryInfo = model.queryInfo;
            const row = model.getRow();
            const title = this.title(row);
            const pageTitle = queryInfo.schemaLabel + ' - ' + queryInfo.plural + ' ' + title;

            return (
                <Page title={pageTitle} hasHeader={true}>
                    <BreadcrumbCreate row={row}>
                        <Link to={AppURL.create('q').toString()}>Schemas</Link>
                        <Link to={AppURL.create('q', queryInfo.schemaName).toString()}>{queryInfo.schemaLabel}</Link>
                        <Link to={AppURL.create('q', queryInfo.schemaName, queryInfo.name).toString()}>
                            {queryInfo.plural}
                        </Link>
                    </BreadcrumbCreate>
                    <PageHeader title={title} />
                    <Detail queryModel={model} detailRenderer={resolveDetailRenderer} asPanel={true} />
                </Page>
            );
        }

        return <LoadingSpinner />;
    }
}
