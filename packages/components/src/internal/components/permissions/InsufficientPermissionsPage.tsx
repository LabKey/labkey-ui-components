/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { Page, PageHeader } from '../../..';

import { InsufficientPermissionsAlert } from './InsufficientPermissionsAlert';

interface Props {
    title: string;
}

export class InsufficientPermissionsPage extends React.PureComponent<Props, any> {
    render() {
        return (
            <Page title={this.props.title} hasHeader={true}>
                <PageHeader title={this.props.title} />
                <InsufficientPermissionsAlert />
            </Page>
        );
    }
}
