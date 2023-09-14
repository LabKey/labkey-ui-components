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
import { isProjectContainer, isProductProjectsEnabled } from '../../app/utils';
import { withRouteLeave } from "../../util/RouteLeave";
import { WithRouterProps } from "react-router";


interface OwnProps {
    inProjectContainer: boolean;
    projectsEnabled: boolean;
    user: User;
}

export type Props = OwnProps & WithRouterProps;

// exported for unit testing
export const AdministrationSubNavImpl: FC<Props> = memo(props => {
    const { inProjectContainer, projectsEnabled, user, router } = props;

    const parentTab = useMemo(() => {
        return  {
            text: 'Back',
            onClick: router.goBack,
        };
    }, [router]);

    const tabs = useMemo(() => {
        const tabs_ = [];

        if (user.isAdmin) {
            tabs_.push('Application Settings');
            if (projectsEnabled) {
                tabs_.push('Projects');
            }
            tabs_.push('Audit Logs');

            if (!projectsEnabled || inProjectContainer)
            {
                tabs_.push('Users');
                tabs_.push('Groups');
            }

            tabs_.push('Permissions');

        }

        return List(
            tabs_.map(text => ({
                text,
                url: text === 'Audit Logs' ? AppURL.create(AUDIT_KEY) : AppURL.create('admin', text.split(' ').at(-1).toLowerCase()),
            }))
        );
    }, [inProjectContainer, projectsEnabled, user.isAdmin]);

    return <SubNav tabs={tabs} noun={parentTab} />;
});

export const AdministrationSubNavWrapper: FC<WithRouterProps> = memo((props) => {
    const { container, moduleContext, user } = useServerContext();
    return (
        <AdministrationSubNavImpl
            inProjectContainer={isProjectContainer(container.path)}
            projectsEnabled={isProductProjectsEnabled(moduleContext)}
            user={user}
            {...props}
        />
    );
});

export const AdministrationSubNav = withRouteLeave(AdministrationSubNavWrapper);
