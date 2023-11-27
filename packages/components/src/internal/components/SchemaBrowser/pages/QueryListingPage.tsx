/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../../public/QueryModel/withQueryModels';
import { Page } from '../../base/Page';
import { Breadcrumb } from '../../navigation/Breadcrumb';
import { AppURL } from '../../../url/AppURL';
import { PageHeader } from '../../base/PageHeader';
import { GridPanel } from '../../../../public/QueryModel/GridPanel';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { getContainerFilterForFolder } from '../../../query/api';

interface BodyProps {
    id: string;
}

const QueryListingBodyImpl: FC<BodyProps & InjectedQueryModels> = memo(({ actions, id, queryModels }) => {
    const model = queryModels[id];
    const { queryInfo } = model;
    const schemaTitle = queryInfo?.schemaLabel ?? '';
    const title = queryInfo?.queryLabel ?? '';

    return (
        <Page hasHeader={true} title={`Query - ${schemaTitle}.${title}`}>
            {queryInfo !== undefined && (
                <Breadcrumb>
                    <a href={AppURL.create('q').toHref()}>Schemas</a>
                    <a href={AppURL.create('q', queryInfo.schemaName).toHref()}>{schemaTitle}</a>
                </Breadcrumb>
            )}

            <PageHeader title={title} />

            <GridPanel actions={actions} model={model} />
        </Page>
    );
});

const QueryListingBody = withQueryModels<BodyProps>(QueryListingBodyImpl);

export const QueryListingPage: FC = () => {
    const { schema, query } = useParams();
    const modelId = `q.${schema}.${query}`;
    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            [modelId]: {
                bindURL: true,
                containerFilter: getContainerFilterForFolder(),
                includeTotalCount: true,
                schemaQuery: new SchemaQuery(schema, query),
            },
        }),
        [modelId, query, schema]
    );

    // Key is used here so that if the schema or query change via the URL we remount the component which will
    // instantiate a new model and reload all page data.
    return <QueryListingBody id={modelId} key={modelId} queryConfigs={queryConfigs} />;
};
