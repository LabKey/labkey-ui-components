import {Map, fromJS} from "immutable";
import {SchemaQuery} from "@glass/base";

import { DomainDesign } from "../models";

const schemas: Map<string, Map<string, boolean>> = fromJS({
    myschema: {
        myquery: true
    }
});

export function fetchDomain(schemaQuery: SchemaQuery): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        const schema = schemas.get(schemaQuery.getSchema());
        if (schema && schema.get(schemaQuery.getQuery())) {
            resolve(new DomainDesign());
        }

        reject('Could not find domain for null');
    });
}