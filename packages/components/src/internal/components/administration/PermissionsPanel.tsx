/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map } from 'immutable'
import { getUpdatedPolicyRoles, getUpdatedPolicyRolesByUniqueName } from "./actions";
import { getServerContext } from "@labkey/api";
import {PermissionsProviderProps, SecurityPolicy} from "../permissions/models";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {Alert} from "../base/Alert";
import {PermissionAssignments} from "../permissions/PermissionAssignments";

interface Props extends PermissionsProviderProps {
    title: string
    containerId: string
    policy: SecurityPolicy
    rolesMap: Map<string, string>
    loading: boolean
    onChange: (policy: SecurityPolicy) => any
    onSuccess: () => any
    showDetailsPanel: boolean
    disableRemoveSelf: boolean
}

export class PermissionsPanel extends React.PureComponent<Props, any> {

    render() {
        const { roles, error, loading, rolesMap, disableRemoveSelf } = this.props;

        if (loading) {
            return <LoadingSpinner/>
        }
        else if (error) {
            return <Alert>{error}</Alert>
        }

        return (
            <PermissionAssignments
                {...this.props}
                roles={getUpdatedPolicyRoles(roles, rolesMap)}
                rolesByUniqueName={getUpdatedPolicyRolesByUniqueName(roles, rolesMap)}
                rolesToShow={rolesMap.keySeq().toList()}
                disabledId={disableRemoveSelf ? getServerContext().user.id : undefined}
                typeToShow={'u'}
            />
        )
    }
}
