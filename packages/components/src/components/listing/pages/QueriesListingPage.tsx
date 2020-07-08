/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Link } from 'react-router';

import { AppURL, Breadcrumb, Page, PageHeader } from '../../..';
import { QueriesListing } from '../QueriesListing';

interface OwnProps {
    params: any;
}

export class QueriesListingPage extends React.Component<OwnProps, any> {
    render() {
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
    }
}
