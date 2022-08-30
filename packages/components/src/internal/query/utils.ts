import { Map } from 'immutable';

import { SchemaDetails } from '../SchemaDetails';

/**
 * Recursively processes raw schema information into a Map<string, SchemaDetails>.
 * Schemas are mapped by their "fullyQualifiedName".
 * @private
 */
export function processSchemas(schemas: any, allSchemas?: Map<string, SchemaDetails>): Map<string, SchemaDetails> {
    let top = false;
    if (allSchemas === undefined) {
        top = true;
        allSchemas = Map<string, SchemaDetails>().asMutable();
    }

    for (const schemaName in schemas) {
        if (schemas.hasOwnProperty(schemaName)) {
            const schema = schemas[schemaName];
            allSchemas.set(schema.fullyQualifiedName.toLowerCase(), SchemaDetails.create(schema));
            if (schema.schemas !== undefined) {
                processSchemas(schema.schemas, allSchemas);
            }
        }
    }

    return top ? allSchemas.asImmutable() : allSchemas;
}
