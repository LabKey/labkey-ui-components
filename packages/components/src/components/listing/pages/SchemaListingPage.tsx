/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';

import { Page, PageHeader } from '../../..';
import { SchemaListing } from '../SchemaListing';

export class SchemaListingPage extends React.Component<any, any> {
    render() {
        return (
            <Page title="Schema Browser" hasHeader={true}>
                <PageHeader title="Schema Browser" />
                <SchemaListing />
            </Page>
        );
    }
}
