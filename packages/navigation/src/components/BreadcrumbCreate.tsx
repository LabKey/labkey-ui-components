/*
 * Copyright (c) 2016-2017 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Map } from 'immutable'
import { CreatedModified } from "@glass/base";

import { Breadcrumb } from './Breadcrumb'

interface Props {
    row?: Map<string, any>
}

export class BreadcrumbCreate extends React.Component<Props, any> {

    render() {
        const { children, row } = this.props;

        return (
            <div className="row component-crumbcreate--container">
                <Breadcrumb className="col-xs-8 col-sm-8 col-md-8">
                    {children}
                </Breadcrumb>
                <CreatedModified row={row} className="col-xs-4 col-sm-4 col-md-4"/>
            </div>
        )
    }
}