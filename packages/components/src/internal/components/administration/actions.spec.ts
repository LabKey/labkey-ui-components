/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, List, Map } from 'immutable';

import { SecurityRole } from '../permissions/models';

import { getUpdatedPolicyRoles, getUpdatedPolicyRolesByUniqueName, getUserGridFilterURL } from './actions';

describe('Administration actions', () => {
    test('getUpdatedPolicyRoles', () => {
        const testRole = SecurityRole.create({ uniqueName: 'testRole', displayName: 'TestRoleDisplayName' });
        const roles = List<SecurityRole>([testRole]);

        // test with no changes
        const noChangeRoles = getUpdatedPolicyRoles(roles, Map<string, string>());
        expect(roles.size === noChangeRoles.size).toBeTruthy();
        expect(noChangeRoles.get(0).uniqueName).toBe(testRole.uniqueName);
        expect(noChangeRoles.get(0).displayName).toBe(testRole.displayName);

        // test with a mapping to a new displayName
        const changedRoles = getUpdatedPolicyRoles(roles, fromJS({ testRole: 'UpdatedDisplayName' }));
        expect(roles.size === changedRoles.size).toBeTruthy();
        expect(changedRoles.get(0).uniqueName).toBe(testRole.uniqueName);
        expect(changedRoles.get(0).displayName).toBe('UpdatedDisplayName');
    });

    test('getUpdatedPolicyRolesByUniqueName', () => {
        const key = 'testRole';
        const testRole = SecurityRole.create({ uniqueName: key, displayName: 'TestRoleDisplayName' });
        const roles = List<SecurityRole>([testRole]);

        // test with no changes
        const noChangeRoles = getUpdatedPolicyRolesByUniqueName(roles, Map<string, string>());
        expect(noChangeRoles.get(key).uniqueName).toBe(testRole.uniqueName);
        expect(noChangeRoles.get(key).displayName).toBe(testRole.displayName);

        // test with a mapping to a new displayName
        const changedRoles = getUpdatedPolicyRolesByUniqueName(roles, fromJS({ testRole: 'UpdatedDisplayName' }));
        expect(changedRoles.get(key).uniqueName).toBe(testRole.uniqueName);
        expect(changedRoles.get(key).displayName).toBe('UpdatedDisplayName');
    });

    test('getUserGridFilterURL', () => {
        const baseExpectedUrl = '/admin/users';
        expect(getUserGridFilterURL(undefined, 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>(), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([]), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([1]), 'query').toString()).toBe(
            baseExpectedUrl + '?query.UserId~in=1'
        );
        expect(getUserGridFilterURL(List<number>([1, 2]), 'query').toString()).toBe(
            baseExpectedUrl + '?query.UserId~in=1%3B2'
        );
    });
});
