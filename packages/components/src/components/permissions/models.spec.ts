/*
 * Copyright (c) 2019 LabKey Corporation
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
import { List, Map, fromJS } from 'immutable';
import { Principal, SecurityPolicy, SecurityRole } from "./models";
import policyJSON from "../../test/data/security-getPolicy.json";
import rolesJSON from "../../test/data/security-getRoles.json";
import { processGetRolesResponse } from "./actions";

const GROUP = Principal.createFromSelectRow(fromJS({
    UserId: {value: 1},
    Type: {value: 'g'},
    Name: {value: 'Group1'},
    DisplayName: {value: undefined},
}));

const USER1 = Principal.createFromSelectRow(fromJS({
    UserId: {value: 2},
    Type: {value: 'u'},
    Name: {value: 'bUser1'},
    DisplayName: {value: undefined},
}));

const USER2 = Principal.createFromSelectRow(fromJS({
    UserId: {value: 3},
    Type: {value: 'u'},
    Name: {value: 'aUser2'},
    DisplayName: {value: 'User 2 Display'},
}));

describe('Principal model', () => {

    test("createFromSelectRow group", () => {
        expect(GROUP.userId).toBe(1);
        expect(GROUP.type).toBe('g');
        expect(GROUP.name).toBe('Group1');
        expect(GROUP.displayName).toBe('Group1');
    });

    test("createFromSelectRow user without displayName", () => {
        expect(USER1.userId).toBe(2);
        expect(USER1.type).toBe('u');
        expect(USER1.name).toBe('bUser1');
        expect(USER1.displayName).toBe('bUser1');
    });

    test("createFromSelectRow user with displayName", () => {
        expect(USER2.userId).toBe(3);
        expect(USER2.type).toBe('u');
        expect(USER2.name).toBe('aUser2');
        expect(USER2.displayName).toBe('aUser2 (User 2 Display)');
    });

    test("filterAndSort", () => {
        const principals = List<Principal>([GROUP, USER1, USER2]);

        // testing filter params
        expect(Principal.filterAndSort(principals, undefined, undefined).size).toBe(3);
        expect(Principal.filterAndSort(principals, 'g', undefined).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'g', List<number>([2])).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'g', List<number>([1])).size).toBe(0);
        expect(Principal.filterAndSort(principals, 'u', undefined).size).toBe(2);
        expect(Principal.filterAndSort(principals, 'u', List<number>([1])).size).toBe(2);
        expect(Principal.filterAndSort(principals, 'u', List<number>([2])).size).toBe(1);
        expect(Principal.filterAndSort(principals, 'u', List<number>([2, 3])).size).toBe(0);

        // testing sort
        const users = Principal.filterAndSort(principals, 'u', undefined);
        expect(users.size).toBe(2);
        expect(users.get(0)).toBe(USER2);
        expect(users.get(1)).toBe(USER1);
    });

});

describe('SecurityRole model', () => {

    test("filter", () => {
        const policy = SecurityPolicy.create(policyJSON);
        const roles = processGetRolesResponse(rolesJSON.roles);

        // check that we default to filtering to the policy relevantRoles
        const relevantRoles = SecurityRole.filter(roles, policy);
        expect(relevantRoles.size).toBe(policy.relevantRoles.size);

        // check that we can filter for an explicit list
        expect(SecurityRole.filter(roles, policy, List<string>()).size).toBe(0);
        const roleArr = ["org.labkey.api.security.roles.EditorRole", "org.labkey.api.security.roles.AuthorRole", "org.labkey.api.security.roles.ReaderRole"];
        expect(SecurityRole.filter(roles, policy, List<string>(roleArr)).size).toBe(3);
    });

});
