/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map, fromJS } from 'immutable'
import { Security } from '@labkey/api'
import { PermissionsProviderProps, Principal, SecurityRole } from "./models";
import { ISelectRowsResult, selectRows } from "../../query/api";
import { LoadingPage } from "../../components/base/LoadingPage";

const Context = React.createContext<PermissionsProviderProps>(undefined);
const PermissionsContextProvider = Context.Provider;
export const PermissionsContextConsumer = Context.Consumer;

type Props = PermissionsProviderProps;

interface State extends PermissionsProviderProps {}

export const PermissionsPageContextProvider = <P extends PermissionsProviderProps>(Component: React.ComponentType<P>) => {

    class PermissionsProviderImpl extends React.Component<Props, State> {

        constructor(props: Props) {
            super(props);

            this.state = {
                roles: undefined,
                rolesByUniqueName: undefined,
                principals: undefined,
                principalsById: undefined,
                error: undefined
            };
        }

        componentDidMount() {
            this.loadSecurityRoles();
            this.loadPrincipals();
        }

        loadSecurityRoles() {
            Security.getRoles({
                success: (data) => {
                    let roles = List<SecurityRole>();
                    data.forEach((role) => {
                        roles = roles.push(SecurityRole.create(role));
                    });

                    let rolesByUniqueName = Map<string, SecurityRole>();
                    roles.map((role) => {
                        rolesByUniqueName = rolesByUniqueName.set(role.uniqueName, role)
                    });

                    this.setState(() => ({roles, rolesByUniqueName}));
                },
                failure: (response) => {
                    this.setState(() => ({error: response.exception}));
                }
            });
        }

        loadPrincipals() {
            selectRows({
                saveInSession: true, // needed so that we can call getQueryDetails
                schemaName: 'core',
                // issue 17704, add displayName for users
                sql: "SELECT p.*, u.DisplayName FROM Principals p LEFT JOIN Users u ON p.type='u' AND p.UserId=u.UserId"
            }).then((data: ISelectRowsResult) => {
                const models = fromJS(data.models[data.key]);
                let principals = List<Principal>();
                let principalsById = Map<number, Principal>();

                data.orderedModels[data.key].forEach((modelKey) => {
                    const row = models.get(modelKey);
                    const principal = Principal.createFromSelectRow(row);

                    principals = principals.push(principal);
                    principalsById = principalsById.set(principal.userId, principal);
                });

                this.setState(() => ({principals, principalsById}));
            }).catch((response) => {
                this.setState(() => ({error: response.message}));
            });
        }

        render() {
            const isLoaded = (this.state.roles && this.state.principals) || this.state.error;

            if (isLoaded) {
                return (
                    <PermissionsContextProvider value={this.state}>
                        <Component {...this.props} {...this.state}/>
                    </PermissionsContextProvider>
                );
            }
            else {
                return <LoadingPage/>;
            }
        }
    }

    return PermissionsProviderImpl;
};
