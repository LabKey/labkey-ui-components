import { SchemaQuery } from "@glass/base";

import { fetchDomain } from "./actions";
import { DomainDesign } from "../models";

jest.mock('./actions');

describe("domain properties actions", () => {

    // test("fetchDomain with schema that does not exist", () => {
    //     const schemaQuery = SchemaQuery.create('notmyschema', 'myquery');
    //     return expect(fetchDomain(schemaQuery)).rejects.toEqual('Could not find domain for null');
    // });
    //
    // test("fetchDomain with query that does not exist", () => {
    //     const schemaQuery = SchemaQuery.create('myschema', 'notmyquery');
    //     return expect(fetchDomain(schemaQuery)).rejects.toEqual('Could not find domain for null');
    // });
    //
    // test("fetchDomain with schema/query that does exist", () => {
    //     const schemaQuery = SchemaQuery.create('myschema', 'myquery');
    //     return expect(fetchDomain(schemaQuery)).resolves.toMatchObject(new DomainDesign());
    // });

});