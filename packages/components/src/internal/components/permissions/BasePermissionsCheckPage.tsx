/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';

import { InsufficientPermissionsPage, LoadingSpinner, Page, PageDetailHeader, Notification, User } from '../../..';

interface Props {
    user: User;
    title: string;
    subTitle?: ReactNode;
    description?: ReactNode;
    hasPermission: boolean;
    renderButtons?: () => any;
}

export class BasePermissionsCheckPage extends React.PureComponent<Props, any> {
    render() {
        const { user, title, subTitle, description, hasPermission, renderButtons, children } = this.props;

        if (!hasPermission) {
            return <InsufficientPermissionsPage title={title} />;
        }

        let body;
        if (!user.permissionsList || user.permissionsList.size === 0) {
            body = <LoadingSpinner />;
        }

        return (
            <Page title={title} hasHeader={true}>
                <PageDetailHeader user={user} title={title} subTitle={subTitle} description={description}>
                    {renderButtons && renderButtons()}
                </PageDetailHeader>
                <Notification user={user} />
                {body || children}
            </Page>
        );
    }
}
