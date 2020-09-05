/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { fromJS } from 'immutable';
import { Link, WithRouterProps } from 'react-router';
import {
    AppURL,
    BreadcrumbCreate,
    DetailPanel,
    InjectedQueryModels,
    LoadingPage,
    Page,
    PageHeader,
    SchemaQuery,
    SCHEMAS,
} from '../../..';

// Importing "withQueryModels" from "../.." causes a circular dependency break...
import { withQueryModels } from '../../../QueryModel/withQueryModels';

interface BodyProps {
    id: string;
}

class DetailBodyImpl extends PureComponent<BodyProps & InjectedQueryModels> {
    get title(): string {
        const { id, queryModels } = this.props;
        const model = queryModels[id];
        const { gridData, hasRows, queryInfo } = model;
        let title: string;

        if (queryInfo && hasRows) {
            const row = gridData[0];
            const { queryLabel, titleColumn } = queryInfo;
            let potentialValues = [];

            if (titleColumn && row[titleColumn]) {
                const { displayValue, formattedValue, value } = row[titleColumn];
                potentialValues = potentialValues.concat([formattedValue, displayValue, value]);
            }

            if (queryLabel && row[queryLabel]) {
                const { displayValue, formattedValue, value } = row[queryLabel];
                potentialValues = potentialValues.concat([formattedValue, displayValue, value]);
            }

            title = potentialValues.find(v => v !== undefined && v !== null);
        }

        if (title === undefined) {
            title = `<${id}>`;
        }

        return title;
    }

    render(): ReactNode {
        const { actions, id, queryModels } = this.props;
        const model = queryModels[id];

        if (model.isLoading) {
            return <LoadingPage title="Query Details" />;
        }

        const { queryInfo } = model;
        const { name, plural, schemaLabel, schemaName } = queryInfo;
        const title = this.title;
        const pageTitle = schemaLabel + ' - ' + plural + ' ' + title;
        const row = fromJS(model.gridData[0]);

        return (
            <Page hasHeader={true} title={pageTitle}>
                <BreadcrumbCreate row={row}>
                    <Link to={AppURL.create('q').toString()}>Schemas</Link>
                    <Link to={AppURL.create('q', schemaName).toString()}>{schemaLabel}</Link>
                    <Link to={AppURL.create('q', schemaName, name).toString()}>{plural}</Link>
                </BreadcrumbCreate>
                <PageHeader title={title} />
                <DetailPanel actions={actions} asPanel model={model} />
            </Page>
        );
    }
}

const DetailBody = withQueryModels<BodyProps>(DetailBodyImpl);

export class QueryDetailPage extends PureComponent<WithRouterProps> {
    render(): ReactNode {
        const { schema, query, id } = this.props.params;
        const modelId = `q.details.${schema}.${query}.${id}`;
        const queryConfigs = {
            [modelId]: {
                bindURL: true,
                keyValue: id,
                requiredColumns: SCHEMAS.CBMB.toArray(),
                schemaQuery: SchemaQuery.create(schema, query),
            },
        };

        // Key is needed so if the user navigates directly from one detail page to another we trigger a remount/reload
        return <DetailBody autoLoad id={modelId} key={modelId} queryConfigs={queryConfigs} />;
    }
}
