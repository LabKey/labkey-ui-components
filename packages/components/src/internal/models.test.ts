import { SchemaQuery } from '../public/SchemaQuery';
import { createGridModelId } from './models';

describe('createGridModelId', () => {
    test('schemaQuery encoding', () => {
        expect(createGridModelId('g', new SchemaQuery('g', 'g'))).toEqual('g|g/g');
        expect(createGridModelId('g', new SchemaQuery('g', 'ABC', null))).toEqual('g|g/abc');
        expect(createGridModelId('g', new SchemaQuery('g', 'DEF', ''))).toEqual('g|g/def');
        expect(createGridModelId('g', new SchemaQuery('/s', '/with/SLASH/', 'sl/asH'))).toEqual(
            'g|$ss/$swith$sslash$s/sl$sash'
        );

        const decoded = '\\$\\/&}~,\\.';
        const encoded = '\\$d\\$s$a$b$t$c\\$p';
        expect(createGridModelId('g', new SchemaQuery(decoded, decoded))).toEqual(`g|${encoded}/${encoded}`);
        expect(createGridModelId('g', new SchemaQuery(decoded, decoded), 'kEy')).toEqual(`g|${encoded}/${encoded}|key`);
        expect(createGridModelId('g', new SchemaQuery(decoded, decoded), decoded)).toEqual(
            `g|${encoded}/${encoded}|${decoded}`
        );
    });
});
