/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PureComponent, memo, ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { InjectedQueryModels, withQueryModels } from '../../../../public/QueryModel/withQueryModels';
import { AppURL } from '../../../url/AppURL';
import { BreadcrumbCreate } from '../../navigation/BreadcrumbCreate';
import { Page } from '../../base/Page';
import { PageHeader } from '../../base/PageHeader';
import { DetailPanel } from '../../../../public/QueryModel/DetailPanel';
import { SCHEMAS } from '../../../schemas';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { LoadingSpinner } from '../../base/LoadingSpinner';

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

        return title;
    }

    render(): ReactNode {
        const { id, queryModels } = this.props;
        const model = queryModels[id];

        if (model.isLoading) {
            return <LoadingSpinner />;
        }

        const { queryInfo } = model;
        const { name, plural, schemaLabel, schemaName } = queryInfo;
        const title = this.title;
        const pageTitle = schemaLabel + ' - ' + plural + ' ' + title;
        const row = model.gridData[0];

        return (
            <Page hasHeader={true} title={pageTitle}>
                <BreadcrumbCreate row={row}>
                    <a href={AppURL.create('q').toHref()}>Schemas</a>
                    <a href={AppURL.create('q', schemaName).toHref()}>{schemaLabel}</a>
                    <a href={AppURL.create('q', schemaName, name).toHref()}>{plural}</a>
                </BreadcrumbCreate>
                {title && <PageHeader title={title} />}
                <DetailPanel asPanel model={model} />
            </Page>
        );
    }
}

const DetailBody = withQueryModels<BodyProps>(DetailBodyImpl);

export const QueryDetailPage: FC = memo(() => {
    const { schema, query, id } = useParams();
    const modelId = `q.details.${schema}.${query}.${id}`;

    const queryConfigs = useMemo(
        () => ({
            [modelId]: {
                bindURL: true,
                keyValue: id,
                requiredColumns: SCHEMAS.CBMB.toArray(),
                schemaQuery: new SchemaQuery(schema, query),
            },
        }),
        [modelId]
    );

    // Key is used here so that if the schema or query change via the URL we remount the component which will
    // instantiate a new model and reload all page data.
    return <DetailBody autoLoad id={modelId} key={modelId} queryConfigs={queryConfigs} />;
});
