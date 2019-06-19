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
import { List } from 'immutable'

import { SchemaQuery, User } from '../models/model'
import {
    getSchemaQuery, resolveKey, resolveKeyFromJson, resolveSchemaQuery,
    intersect, naturalSort, toLowerSafe, unorderedEqual
} from './utils'
import { hasAllPermissions } from './utils';
import { PermissionTypes } from '../models/constants'

const emptyList = List<string>();

describe('resolveKey', () => {
    test("no encodings", () => {
        expect(resolveKey("schema", "query")).toBe("schema/query");
        expect(resolveKey("Schema", "Query")).toBe("schema/query");
        expect(resolveKey("ScheMa", "QueRy")).toBe("schema/query");
    });

    test("with encodings", () => {
        expect(resolveKey("$chem&", "{query,/.more~less}")).toBe("$dchem$a/{query$c$s$pmore$tless$b");
        expect(resolveKey("$,hema$", "q&x&&&d")).toBe("$d$chema$d/q$ax$a$a$ad");
    });
});

describe("resolveKeyFromJson", () => {
    test("schema name with one part", () => {
        expect(resolveKeyFromJson({schemaName: ["partOne"], queryName: "q/Name"})).toBe("partone/q$sname");
        expect(resolveKeyFromJson({schemaName: ["p&rtOne"], queryName: "//$Name"})).toBe("p$artone/$s$s$dname");
    });

    test("schema name with multiple parts", () => {
        expect(resolveKeyFromJson({schemaName: ["one", "Two", "thrEE$"], queryName: "four"})).toBe("one$ptwo$pthree$d/four")
    });
});

describe("resolveSchemaQuery", () => {
    test("handle undefined schemaQuery", () => {
        expect(resolveSchemaQuery(undefined)).toBeNull()
    });

    test("schema without encoding required", () => {
        const schemaQuery = new SchemaQuery({
            schemaName: "name",
            queryName: "my favorite query"
        });
        expect(resolveSchemaQuery(schemaQuery)).toBe("name/my favorite query")
    });
});

describe("getSchemaQuery", () => {
   test("no decoding required", () => {
       const expected = new SchemaQuery({
           schemaName: "name",
           queryName: "query"
       });
       expect(getSchemaQuery("name/query")).toEqual(expected);
   });

   test("decoding required", () => {
       expect(getSchemaQuery("my$Sname/just$pask")).toEqual(new SchemaQuery( {
           schemaName: "my/name",
           queryName: "just.ask"
       }));
       expect(getSchemaQuery("one$ptwo$pthree$d/q1")).toEqual(new SchemaQuery({
           schemaName: "one.two.three$",
           queryName: "q1"
       }));
   });
});

describe("naturalSort", () => {
    test("alphabetic", () => {
        expect(naturalSort("", "anything")).toBe(1);
        expect(naturalSort("anything", "")).toBe(-1);
        expect(naturalSort(undefined, "anything")).toBe(1);
        expect(naturalSort("a", "a")).toBe(0);
        expect(naturalSort("alpha", "aLPha")).toBe(0);
        expect(naturalSort(" ", "anything")).toBe(-1);
        expect(naturalSort("a", "b")).toBe(-1);
        expect(naturalSort("A", "b")).toBe(-1);
        expect(naturalSort("A", "Z")).toBe(-1);
        expect(naturalSort("alpha", "zeta")).toBe(-1);
        expect(naturalSort("zeta", "atez")).toBe(1);
        expect(naturalSort("Zeta", "Atez")).toBe(1);
    });

    test("alphanumeric", () => {
        expect(naturalSort("a1.2", "a1.3")).toBeLessThan(0);
        expect(naturalSort("1.431", "14.31")).toBeLessThan(0);
        expect(naturalSort("10", "1.0")).toBeGreaterThan(0);
        expect(naturalSort("1.2ABC", "1.2XY")).toBeLessThan(0);
    });
});

describe("intersect", () => {
    test("with matches", () => {
        expect(intersect(List<string>(["a", "b", "abc"]), List<string>(["A", "Z", "aBC"])))
            .toEqual(List<string>(['a', 'abc']));
        expect(intersect(List(["fun", "times"]), List(["funny", "times"])))
            .toEqual(List(['times']));
    });

    test("without matches", () => {
        expect(intersect(List<string>(["one", "two"]), List(["sun", "moon"])))
            .toEqual(emptyList);
        expect(intersect(emptyList, List(["fun", "times"])))
            .toEqual(emptyList);
        expect(intersect(List(["fun", "times"]), emptyList))
            .toEqual(emptyList);
    });
});

describe("toLowerSafe", () => {
    test("strings", () => {
        expect(toLowerSafe(List<string>(['TEST ', ' Test', 'TeSt', 'test'])))
            .toEqual(List<string>(['test ', ' test', 'test', 'test']));
    });

    test("numbers", () => {
        expect(toLowerSafe(List<string>([1,2,3])))
            .toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0])))
            .toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0, 2])))
            .toEqual(emptyList);
    });

    test("strings and numbers", () => {
        expect(toLowerSafe(List<string>([1, 2, 'TEST ', ' Test', 3.0, 4.4, 'TeSt', 'test'])))
            .toEqual(List<string>(['test ', ' test', 'test', 'test']));
    });
});

describe("hasAllPermissions", () => {
    test("user without permission", () => {
        expect(hasAllPermissions(new User(), [PermissionTypes.Insert])).toBe(false);
    });


    test("user has some but not all permissions", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Read]
        }), [PermissionTypes.Insert, PermissionTypes.Read])).toBe(false);
    });

    test("user has only required permission", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Insert]
        }), [PermissionTypes.Insert])).toBe(true);
    });

    test("user has more permission", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Insert, PermissionTypes.Delete, PermissionTypes.Read]
        }), [PermissionTypes.Insert])).toBe(true);
    });


    test("user permissions do not intersect", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Delete, PermissionTypes.Read]
        }), [PermissionTypes.Insert])).toBe(false);

    });
});

describe("unorderedEqual", () => {
    test("empty arrays", () => {
        expect(unorderedEqual([], [])).toBe(true);
    });

    test("different size arrays", () => {
        expect(unorderedEqual(["a"], ["b", "a"])).toBe(false);
    });

    test("same size but differnet elements", () => {
        expect(unorderedEqual(["a", "b"], ["b", "c"])).toBe(false);
    });

    test("elements in different order", () => {
        expect(unorderedEqual(["a", "b", "c", "d"], ["d", "c", "a", "b"])).toBe(true);
    });

    test("equal arrays, same order", () => {
        expect(unorderedEqual(["a", "b", "c", "d"], ["a", "b", "c", "d"])).toBe(true);
    })
});