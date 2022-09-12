/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';

import { List } from 'immutable';

import { ITab, SubNav } from '../navigation/SubNav';
import { AppURL } from '../../url/AppURL';
import { useServerContext } from '../base/ServerContext';

import { User } from '../base/models/User';

export const getAdministrationSubNavTabs = (user: User): List<ITab> => {
    let tabs = List<string>();

    if (user.isAdmin) {
        tabs = tabs.push('Users');
        tabs = tabs.push('Permissions');
        tabs = tabs.push('Groups');
        tabs = tabs.push('Settings');
    }

    return tabs
        .map(text => ({
            text,
            url: AppURL.create('admin', text.toLowerCase()),
        }))
        .toList();
};

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

export const AdministrationSubNav: FC = () => {
    const { user } = useServerContext();

    return <SubNav tabs={getAdministrationSubNavTabs(user)} noun={PARENT_TAB} />;
};
