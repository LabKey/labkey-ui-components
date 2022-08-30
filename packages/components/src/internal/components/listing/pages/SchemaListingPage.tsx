/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';

import { SchemaListing } from '../SchemaListing';
import { Page } from '../../base/Page';
import { PageHeader } from '../../base/PageHeader';

export class SchemaListingPage extends Component {
    render = (): ReactNode => {
        return (
            <Page title="Schema Browser" hasHeader={true}>
                <PageHeader title="Schema Browser" />
                <SchemaListing />
            </Page>
        );
    };
}
