/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useMemo } from 'react';

import { Container } from '../base/models/Container';
import { User } from '../base/models/User';
import { PageDetailHeader } from '../forms/PageDetailHeader';

import { getUserLastLogin } from './actions';

interface Props {
    container?: Partial<Container>;
    dateFormat?: string;
    renderButtons?: ReactNode;
    showFolderTitle?: boolean;
    title: string;
    user: User;
    userProperties?: Record<string, any>;
}

export const UserDetailHeader: FC<Props> = props => {
    const { container, dateFormat, renderButtons, showFolderTitle = true, title, user, userProperties } = props;
    const lastLogin = useMemo(() => getUserLastLogin(userProperties, dateFormat), [dateFormat, userProperties]);

    return (
        <PageDetailHeader
            iconAltText={user.displayName + ' avatar'}
            iconUrl={user.avatar}
            leftColumns={9}
            title={title}
        >
            {showFolderTitle && !!container?.title && (
                <div className="detail__header--desc">
                    <i className="fa fa-folder-open" />
                    &nbsp;{container.title}
                </div>
            )}
            {lastLogin && <div className="detail__header--desc pull-right">Last Login: {lastLogin}</div>}
            {renderButtons && <div className={lastLogin ? 'detail__header--buttons' : ''}>{renderButtons}</div>}
        </PageDetailHeader>
    );
};

UserDetailHeader.displayName = 'UserDetailHeader';
