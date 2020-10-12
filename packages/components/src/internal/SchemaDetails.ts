import { List, Record } from 'immutable';

export class SchemaDetails extends Record({
    description: undefined,
    fullyQualifiedName: undefined,
    hidden: true,
    schemaName: undefined,
    schemas: List<string>(),
}) {
    description: string;
    fullyQualifiedName: string;
    hidden: boolean;
    schemaName: string;
    schemas: List<string>;

    static create(schema): SchemaDetails {
        const copy = Object.assign({}, schema);
        const schemas = List<string>().asMutable();

        if (schema.schemas) {
            for (const s in schema.schemas) {
                if (schema.schemas.hasOwnProperty(s)) {
                    schemas.push(schema.schemas[s].fullyQualifiedName.toLowerCase());
                }
            }
        }

        copy.schemas = schemas.asImmutable();
        return new SchemaDetails(copy);
    }

    getLabel() {
        return this.schemaName;
    }

    getName() {
        return this.fullyQualifiedName;
    }
}
