/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren } from 'react';

import { Notifications } from '../notifications/Notifications';

interface PageHeaderProps extends PropsWithChildren {
    iconCls?: string;
    primaryHeader?: boolean;
    showNotifications?: boolean;
    title?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
    children,
    iconCls,
    primaryHeader,
    showNotifications = true,
    title,
}) => {
    const showTitle = !!iconCls || !!title;

    return (
        <div className="page-header">
            {children}

            {showTitle && primaryHeader && (
                <h1 className="no-margin-top">
                    {iconCls ? <span className={'page-header-icon ' + iconCls}>&nbsp;</span> : null}
                    {title}
                </h1>
            )}
            {showTitle && !primaryHeader && (
                <h2 className="no-margin-top">
                    {iconCls ? <span className={'page-header-icon ' + iconCls}>&nbsp;</span> : null}
                    {title}
                </h2>
            )}

            {showNotifications && <Notifications />}
        </div>
    );
};

PageHeader.displayName = 'PageHeader';
