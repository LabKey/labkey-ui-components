/*
 * Copyright (c) 2015-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Record, List, Map } from 'immutable';

import React from 'react';

import { naturalSort } from '../../../public/sort';
import { Groups, MemberType } from '../administration/models';

export class Principal extends Record({
    userId: undefined,
    name: undefined,
    displayName: undefined,
    type: undefined,
    active: true,
    isSiteGroup: false,
}) {
    declare userId: number;
    declare name: string;
    declare displayName: string;
    declare type: string;
    declare active: boolean;
    declare isSiteGroup: boolean;

    static create(raw: any): Principal {
        return new Principal({ ...raw });
    }

    static createFromSelectRow(row: Map<string, Map<string, any>>): Principal {
        const userId = row.getIn(['UserId', 'value']);
        const type = row.getIn(['Type', 'value']);
        const name = row.getIn(['Name', 'value']);

        let displayName = row.getIn(['DisplayName', 'value']);
        displayName = type === MemberType.user && displayName ? name + ' (' + displayName + ')' : name;

        return new Principal({ userId, name, type, displayName });
    }

    static filterAndSort(
        principals: List<Principal>,
        groupMembership: Groups,
        excludeUserIds?: List<number>
    ): List<Principal> {
        return (
            principals
                // filter out any principals that are already members of this role, and built-in site groups
                .filter(
                    principal =>
                        (excludeUserIds === undefined || !excludeUserIds.contains(principal.userId)) &&
                        principal.userId > 0
                )
                // Supply information on whether a principal is a site group or not
                .map(
                    principal =>
                        (groupMembership && groupMembership[principal.userId]?.type === MemberType.siteGroup
                            ? principal.set('isSiteGroup', true)
                            : principal) as Principal
                )
                // finally sort by type (group or user) and then display name
                .sort((p1, p2) => naturalSort(p1.displayName, p2.displayName))
                .toList()
        );
    }
}

export class SecurityRole extends Record({
    description: undefined,
    displayName: undefined,
    excludedPrincipals: List<number>(),
    name: undefined,
    permissions: List<string>(),
    sourceModule: undefined,
    uniqueName: undefined,
}) {
    declare description: string;
    declare displayName: string;
    declare excludedPrincipals: List<number>;
    declare name: string;
    declare permissions: List<string>;
    declare sourceModule: string;
    declare uniqueName: string;

    static create(raw: any): SecurityRole {
        let excludedPrincipals = List<number>();
        if (raw.excludedPrincipals) {
            excludedPrincipals = List<number>(raw.excludedPrincipals);
        }

        let permissions = List<string>();
        if (raw.permissions) {
            permissions = List<string>(raw.permissions);
        }

        return new SecurityRole({
            ...raw,
            excludedPrincipals,
            permissions,
        });
    }

    // use the explicit set of roles, fall back to the relevant roles for the policy
    static filter(roles: List<SecurityRole>, policy: SecurityPolicy, rolesToShow?: List<string>, rolesHidden?: string[]): List<SecurityRole> {
        return roles
            .filter(role => {
                return (
                    policy.relevantRoles.contains(role.uniqueName) &&
                    (!rolesToShow || rolesToShow.contains(role.uniqueName)) &&
                    (!rolesHidden || (rolesHidden.indexOf(role.uniqueName) === -1))
                );
            })
            .toList();
    }
}

export class SecurityAssignment extends Record({
    role: undefined,
    userId: undefined,
    displayName: undefined,
    type: undefined,
    isNew: false,
}) {
    declare role: string;
    declare userId: number;
    declare displayName: string;
    declare type: string;
    declare isNew: boolean;

    static isTypeMatch(assignmentType: string, typeToMatch: string): boolean {
        // inactive users will return type of undefined
        if (typeToMatch === MemberType.user && assignmentType === undefined) {
            return true;
        }

        return assignmentType === typeToMatch;
    }

    static getDisplayName(assignment: SecurityAssignment): string {
        // inactive users will return type of undefined
        if (assignment.type === undefined) {
            return 'Inactive User: ' + assignment.userId;
        }

        return assignment.displayName || assignment.userId.toString();
    }
}

export class SecurityPolicy extends Record({
    assignments: List<SecurityAssignment>(),
    assignmentsByRole: Map<string, List<SecurityAssignment>>(),
    modified: undefined,
    resourceId: undefined,
    relevantRoles: List<string>(),
    containerId: undefined,
}) {
    declare assignments: List<SecurityAssignment>;
    declare assignmentsByRole: Map<string, List<SecurityAssignment>>;
    declare modified: string;
    declare resourceId: string;
    declare relevantRoles: List<string>;
    declare containerId: string;

    static create(raw: any): SecurityPolicy {
        let assignments = List<SecurityAssignment>();
        if (raw.policy && raw.policy.assignments) {
            assignments = List<SecurityAssignment>(
                raw.policy.assignments.map(assignment => new SecurityAssignment(assignment))
            );
        }

        let relevantRoles = List<string>();
        if (raw.relevantRoles) {
            relevantRoles = List<string>(raw.relevantRoles);
        }

        return new SecurityPolicy({
            ...raw.policy,
            assignments,
            assignmentsByRole: SecurityPolicy.getAssignmentsByRole(assignments),
            relevantRoles,
            containerId: raw.containerId,
        });
    }

    static getAssignmentsByRole(assignments: List<SecurityAssignment>): Map<string, List<SecurityAssignment>> {
        let assignmentsByRole = Map<string, List<SecurityAssignment>>();

        assignments.map(assignment => {
            if (!assignmentsByRole.has(assignment.role)) {
                assignmentsByRole = assignmentsByRole.set(assignment.role, List<SecurityAssignment>());
            }

            const principals = assignmentsByRole.get(assignment.role);
            assignmentsByRole = assignmentsByRole.set(assignment.role, principals.push(assignment));
        });

        return assignmentsByRole;
    }

    static removeAssignment(policy: SecurityPolicy, userId: number, role: SecurityRole): SecurityPolicy {
        const assignments = policy.assignments
            .filter(assignment => !(assignment.role === role.uniqueName && assignment.userId === userId))
            .toList();

        return policy.merge({
            assignments,
            assignmentsByRole: SecurityPolicy.getAssignmentsByRole(assignments),
        }) as SecurityPolicy;
    }

    static addUserIdAssignment(policy: SecurityPolicy, userId: number, roleUniqueName: string): SecurityPolicy {
        const principal = new Principal({ userId, type: MemberType.user });
        const role = new SecurityRole({ uniqueName: roleUniqueName });
        return this.addAssignment(policy, principal, role);
    }

    static addAssignment(policy: SecurityPolicy, principal: Principal, role: SecurityRole): SecurityPolicy {
        const assignments = policy.assignments.push(
            new SecurityAssignment(Object.assign({ role: role.uniqueName, isNew: true }, principal.toJS()))
        );

        return policy.merge({
            assignments,
            assignmentsByRole: SecurityPolicy.getAssignmentsByRole(assignments),
        }) as SecurityPolicy;
    }

    static updateAssignmentsData(policy: SecurityPolicy, principalsById: Map<number, Principal>): SecurityPolicy {
        const assignments = policy.assignments
            .map(assignment => {
                const principal = principalsById ? principalsById.get(assignment.userId) : undefined;

                const updatedAssignment = principal
                    ? (assignment.merge({
                          displayName: (!principal.active ? 'Inactive User: ' : '') + principal.displayName,
                          type: principal.type,
                      }) as SecurityAssignment)
                    : assignment;

                return updatedAssignment;
            })
            .toList();

        return policy.merge({
            assignments,
            assignmentsByRole: SecurityPolicy.getAssignmentsByRole(assignments),
        }) as SecurityPolicy;
    }

    isInheritFromParent(): boolean {
        return this.containerId && this.resourceId !== this.containerId;
    }
}

export interface PermissionsProviderProps {
    error?: string;
    inactiveUsersById?: Map<number, Principal>;
    principals?: List<Principal>;
    principalsById?: Map<number, Principal>;
    roles?: List<SecurityRole>;
    rolesByUniqueName?: Map<string, SecurityRole>;
}
