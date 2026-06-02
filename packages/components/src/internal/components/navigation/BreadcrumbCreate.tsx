/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren } from 'react';

import { CreatedModified } from '../base/CreatedModified';

import { Breadcrumb } from './Breadcrumb';

interface Props extends PropsWithChildren {
    row?: Record<string, any>;
    useServerDate?: boolean;
}

export const BreadcrumbCreate: FC<Props> = memo(props => (
    <div className="row component-crumbcreate--container">
        <Breadcrumb className="col-xs-8 col-sm-8 col-md-8">{props.children}</Breadcrumb>
        <CreatedModified row={props.row} useServerDate={props.useServerDate} className="col-xs-4 col-sm-4 col-md-4" />
    </div>
));
BreadcrumbCreate.displayName = 'BreadcrumbCreate';
