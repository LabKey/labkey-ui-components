/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, useMemo } from 'react';

import { hasAllPermissions, useServerContext } from '../../..';

interface Props {
    perms: string | string[];
}

/**
 * This component is intended to be used to wrap other components which should only be displayed when the
 * user has specific permissions. Permissions are defined on the application user and can be specified by
 * importing PermissionTypes. The component uses "useServerContext" to access the current user so it
 * requires access to the "ServerContext".
 */
export const RequiresPermission: FC<Props> = ({ children, perms }) => {
    const { user } = useServerContext();

    const allow = useMemo<boolean>(() => hasAllPermissions(user, typeof perms === 'string' ? [perms] : perms), [
        perms,
        user,
    ]);

    return <>{React.Children.map(children, child => (allow ? child : null))}</>;
};
