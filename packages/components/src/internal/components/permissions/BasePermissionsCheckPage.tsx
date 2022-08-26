/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';
import {User} from "../base/models/User";
import {InsufficientPermissionsPage} from "./InsufficientPermissionsPage";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {Page} from "../base/Page";
import {PageDetailHeader} from "../forms/PageDetailHeader";
import {Notifications} from "../notifications/Notifications";

interface Props {
    user: User;
    title: string;
    subTitle?: ReactNode;
    description?: ReactNode;
    hasPermission: boolean;
    renderButtons?: () => ReactNode;
}

export const BasePermissionsCheckPage: FC<Props> = memo(props => {
    const { user, title, subTitle, description, hasPermission, renderButtons, children } = props;

    if (!hasPermission) {
        return <InsufficientPermissionsPage title={title} />;
    }

    let body;
    if (!user.permissionsList || user.permissionsList.size === 0) {
        body = <LoadingSpinner />;
    }

    return (
        <Page hasHeader title={title}>
            <PageDetailHeader title={title} subTitle={subTitle} description={description}>
                {renderButtons?.()}
            </PageDetailHeader>
            <Notifications />
            {body || children}
        </Page>
    );
});
