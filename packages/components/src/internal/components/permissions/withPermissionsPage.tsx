/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Security } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';

import { LoadingPage } from '../base/LoadingPage';

import { Principal, SecurityRole } from './models';
import {
    getPrincipals,
    getInactiveUsers,
    getPrincipalsById,
    getRolesByUniqueName,
    processGetRolesResponse,
} from './actions';

export interface InjectedPermissionsPage {
    error: string;
    inactiveUsersById: Map<number, Principal>;
    principals: List<Principal>;
    principalsById: Map<number, Principal>;
    roles: List<SecurityRole>;
    rolesByUniqueName: Map<string, SecurityRole>;
}

interface State extends InjectedPermissionsPage {
    isLoaded: boolean;
}

export function withPermissionsPage<Props>(
    Component: ComponentType<Props & InjectedPermissionsPage>
): ComponentType<Props> {
    type WrappedProps = Props & InjectedPermissionsPage;

    class ComponentWithPermissions extends PureComponent<WrappedProps, State> {
        constructor(props: WrappedProps) {
            super(props);

            this.state = {
                error: undefined,
                inactiveUsersById: Map(),
                isLoaded: false,
                principals: List(),
                principalsById: Map(),
                roles: List(),
                rolesByUniqueName: Map(),
            };
        }

        componentDidMount(): void {
            Promise.allSettled([this.loadSecurityRoles(), this.loadPrincipals(), this.loadInactiveUsers()]).then(() => {
                this.setState({ isLoaded: true });
            });
        }

        loadSecurityRoles(): Promise<void> {
            return new Promise((resolve, reject) => {
                Security.getRoles({
                    success: rawRoles => {
                        const roles = processGetRolesResponse(rawRoles);
                        const rolesByUniqueName = getRolesByUniqueName(roles);
                        this.setState({ roles, rolesByUniqueName });
                        resolve();
                    },
                    failure: e => {
                        console.error('Failed to load security roles', e);
                        this.setState({ error: resolveErrorMessage(e, 'roles') });
                        reject();
                    },
                });
            });
        }

        loadPrincipals = async (): Promise<void> => {
            try {
                const principals = await getPrincipals();
                this.setState({ principals, principalsById: getPrincipalsById(principals) });
            } catch (e) {
                this.setState({ error: resolveErrorMessage(e, 'users') });
            }
        };

        loadInactiveUsers = async (): Promise<void> => {
            try {
                const inactiveUsers = await getInactiveUsers();
                this.setState({ inactiveUsersById: getPrincipalsById(inactiveUsers) });
            } catch (e) {
                this.setState({ error: resolveErrorMessage(e, 'users') });
            }
        };

        render(): ReactNode {
            const { error, isLoaded } = this.state;

            if (!error && !isLoaded) {
                return <LoadingPage />;
            }

            return <Component {...this.props} {...this.state} />;
        }
    }

    return ComponentWithPermissions;
}
