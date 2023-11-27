/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { useParams } from 'react-router-dom';

import { QueriesListing } from '../QueriesListing';
import { Page } from '../../base/Page';
import { Breadcrumb } from '../../navigation/Breadcrumb';
import { AppURL } from '../../../url/AppURL';
import { PageHeader } from '../../base/PageHeader';

export const QueriesListingPage: FC = memo(() => {
    const { schema } = useParams();

    return (
        <Page title={'Schema Queries - ' + schema} hasHeader={true}>
            <Breadcrumb>
                <a href={AppURL.create('q').toHref()}>Schemas</a>
            </Breadcrumb>
            <PageHeader title={schema + ' Schema'} />
            <QueriesListing schemaName={schema} asPanel={true} hideEmpty={true} />
        </Page>
    );
});
