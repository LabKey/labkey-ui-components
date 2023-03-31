/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';

import { ITab } from '../navigation/types';
import { SubNav } from '../navigation/SubNav';
import { AppURL } from '../../url/AppURL';
import { useServerContext } from '../base/ServerContext';
import { User } from '../base/models/User';
import { AUDIT_KEY } from '../../app/constants';
import { isProjectContainer, isProductProjectsEnabled } from '../../app/utils';

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

interface Props {
    inProjectContainer: boolean;
    projectsEnabled: boolean;
    user: User;
}

// exported for unit testing
export const AdministrationSubNavImpl: FC<Props> = memo(props => {
    const { inProjectContainer, projectsEnabled, user } = props;

    const tabs = useMemo(() => {
        const tabs_ = [];

        if (user.isAdmin) {
            tabs_.push('Audit Logs');

            if (!projectsEnabled || inProjectContainer)
                tabs_.push('Groups');
            tabs_.push('Permissions');
            if (projectsEnabled && inProjectContainer) {
                tabs_.push('Projects');
            }
            tabs_.push('Settings');
            if (!projectsEnabled || inProjectContainer)
                tabs_.push('Users');
        }

        return List(
            tabs_.map(text => ({
                text,
                url: text === 'Audit Logs' ? AppURL.create(AUDIT_KEY) : AppURL.create('admin', text.toLowerCase()),
            }))
        );
    }, [inProjectContainer, projectsEnabled, user.isAdmin]);

    return <SubNav tabs={tabs} noun={PARENT_TAB} />;
});

export const AdministrationSubNav: FC = memo(() => {
    const { container, moduleContext, user } = useServerContext();
    return (
        <AdministrationSubNavImpl
            inProjectContainer={isProjectContainer(container.path)}
            projectsEnabled={isProductProjectsEnabled(moduleContext)}
            user={user}
        />
    );
});
