/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { Link, WithRouterProps } from 'react-router';

import { AppURL, SchemaQuery, Breadcrumb, InjectedQueryModels, GridPanel, Page, PageHeader } from '../../..';

// Importing "withQueryModels" from "../.." causes a circular dependency break...
import { withQueryModels } from '../../../QueryModel/withQueryModels';

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
                    <Link to={AppURL.create('q').toString()}>Schemas</Link>
                    <Link to={AppURL.create('q', queryInfo.schemaName).toString()}>{schemaTitle}</Link>
                </Breadcrumb>
            )}

            <PageHeader title={title} />

            <GridPanel actions={actions} model={model} />
        </Page>
    );
});

const QueryListingBody = withQueryModels<BodyProps>(QueryListingBodyImpl);

export const QueryListingPage: FC<WithRouterProps> = ({ params }) => {
    const { schema, query } = params;
    const modelId = `q.${schema}.${query}`;
    const queryConfigs = useMemo(
        () => ({
            [modelId]: { bindURL: true, schemaQuery: SchemaQuery.create(schema, query) },
        }),
        [modelId]
    );

    // Key is used here so that if the schema or query change via the URL we remount the component which will
    // instantiate a new model and reload all page data.
    return <QueryListingBody id={modelId} key={modelId} queryConfigs={queryConfigs} />;
};
