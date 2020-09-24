/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';
import { Link, WithRouterProps } from 'react-router';

import { AppURL, Breadcrumb, Page, PageHeader } from '../../../..';
import { QueriesListing } from '../QueriesListing';

export class QueriesListingPage extends Component<WithRouterProps> {
    render = (): ReactNode => {
        const { schema } = this.props.params;

        return (
            <Page title={'Schema Queries - ' + schema} hasHeader={true}>
                <Breadcrumb>
                    <Link to={AppURL.create('q').toString()}>Schemas</Link>
                </Breadcrumb>
                <PageHeader title={schema + ' Schema'} />
                <QueriesListing schemaName={schema} asPanel={true} hideEmpty={true} />
            </Page>
        );
    };
}
