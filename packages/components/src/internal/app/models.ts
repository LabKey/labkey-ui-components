/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Record } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { Container } from '../components/base/models/Container';
import { User } from '../components/base/models/User';

const user = new User({
    ...getServerContext().user,
    permissionsList: List(getServerContext().container?.effectivePermissions ?? []),
});

export enum LogoutReason {
    SERVER_LOGOUT,
    SESSION_EXPIRED,
    SERVER_UNAVAILABLE,
}

export class AppModel extends Record({
    container: new Container(getServerContext().container),
    contextPath: ActionURL.getContextPath(),
    initialUserId: user.id,
    logoutReason: undefined,
    reloadRequired: false,
    user,
}) {
    declare container: Container;
    declare contextPath: string;
    declare initialUserId: number;
    declare logoutReason: LogoutReason;
    declare reloadRequired: boolean;
    declare user: User;

    hasUserChanged(): boolean {
        return this.initialUserId !== this.user.id;
    }

    shouldReload(): boolean {
        return this.reloadRequired || this.hasUserChanged();
    }
}

export interface AppProperties {
    controllerName: string;
    logoBadgeImageUrl: string;
    logoWithTextImageUrl: string;
    moduleName: string;
    name: string;
    productId: string;
}
