/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';

import { SubNav } from '../navigation/SubNav';
import { AppURL } from '../../url/AppURL';
import { useServerContext } from '../base/ServerContext';
import { User } from '../base/models/User';
import { AUDIT_KEY } from '../../app/constants';
import { isProjectContainer, isProductProjectsEnabled, isAppHomeFolder } from '../../app/utils';
import { useContainerUser } from '../container/actions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ITab } from '../navigation/types';

interface Props {
    appHomeUser: User;
    inProjectContainer: boolean;
    isAppHome: boolean;
    projectsEnabled: boolean;
    user: User;
}

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

// exported for unit testing
export const AdministrationSubNavImpl: FC<Props> = memo(props => {
    const { inProjectContainer, appHomeUser, projectsEnabled, user } = props;

    const tabs = useMemo(() => {
        const tabs_ = [];

        if (user.isAdmin) {
            if (appHomeUser.isAdmin) tabs_.push('Application Settings');

            if (projectsEnabled) {
                tabs_.push('Projects');
            }
            tabs_.push('Audit Logs');

            if (!projectsEnabled || inProjectContainer) {
                tabs_.push('Users');
                tabs_.push('Groups');
            }

            tabs_.push('Permissions');
        }

        return List(
            tabs_.map(text => ({
                text,
                url:
                    text === 'Audit Logs'
                        ? AppURL.create(AUDIT_KEY)
                        : AppURL.create('admin', text.split(' ').at(-1).toLowerCase()),
            }))
        );
    }, [inProjectContainer, projectsEnabled, user.isAdmin]);

    return <SubNav tabs={tabs} noun={PARENT_TAB} showLKVersion={true} />;
});

export const AdministrationSubNav: FC = memo(() => {
    const { container, moduleContext, user } = useServerContext();
    const isAppHome = isAppHomeFolder(container, moduleContext);
    const homeFolderPath = isAppHome ? container.path : container.parentPath;
    const homeProjectContainer = useContainerUser(homeFolderPath, { includeStandardProperties: true });

    if (!homeProjectContainer.isLoaded) return <LoadingSpinner />;

    return (
        <AdministrationSubNavImpl
            inProjectContainer={isProjectContainer(container.path)}
            projectsEnabled={isProductProjectsEnabled(moduleContext)}
            isAppHome={isAppHome}
            user={user}
            appHomeUser={homeProjectContainer?.user ?? user}
        />
    );
});
