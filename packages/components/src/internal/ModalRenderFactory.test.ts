/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { SchemaQuery } from '../public/SchemaQuery';

import {
    ModalRenderContext,
    ModalRendererComponent,
    registerModalRenderer,
    resolveModalRenderer,
} from './ModalRenderFactory';

const ExactRenderer: ModalRendererComponent = () => null;
const SchemaRenderer: ModalRendererComponent = () => null;

describe('ModalRenderFactory', () => {
    test('resolves an exact SchemaQuery registration', () => {
        const sq = new SchemaQuery('exact.schema', 'SomeQuery');
        registerModalRenderer(sq, ExactRenderer);

        expect(resolveModalRenderer(sq)).toBe(ExactRenderer);
        expect(resolveModalRenderer(new SchemaQuery('exact.schema', 'OtherQuery'))).toBeUndefined();
    });

    test('resolves case-insensitively', () => {
        registerModalRenderer(new SchemaQuery('Case.Schema', 'MixedQuery'), ExactRenderer);

        expect(resolveModalRenderer(new SchemaQuery('case.schema', 'mixedquery'))).toBe(ExactRenderer);
    });

    test('falls back to a schema-wide string registration', () => {
        registerModalRenderer('fallback.schema', SchemaRenderer);

        expect(resolveModalRenderer(new SchemaQuery('fallback.schema', 'AnyQuery'))).toBe(SchemaRenderer);
        expect(resolveModalRenderer(new SchemaQuery('other.schema', 'AnyQuery'))).toBeUndefined();
    });

    test('exact registration wins over the schema-wide fallback', () => {
        const sq = new SchemaQuery('override.schema', 'SpecialQuery');
        registerModalRenderer('override.schema', SchemaRenderer);
        registerModalRenderer(sq, ExactRenderer);

        expect(resolveModalRenderer(sq)).toBe(ExactRenderer);
        expect(resolveModalRenderer(new SchemaQuery('override.schema', 'PlainQuery'))).toBe(SchemaRenderer);
    });

    test('explicit null registration excludes a query from the schema-wide fallback', () => {
        const excluded = new SchemaQuery('excluded.schema', 'ExcludedQuery');
        registerModalRenderer('excluded.schema', SchemaRenderer);
        registerModalRenderer(excluded, null);

        expect(resolveModalRenderer(excluded)).toBeUndefined();
        expect(resolveModalRenderer(new SchemaQuery('excluded.schema', 'IncludedQuery'))).toBe(SchemaRenderer);
    });

    test('registrations are scoped by ModalRenderContext', () => {
        const sq = new SchemaQuery('context.schema', 'ContextQuery');
        registerModalRenderer(sq, ExactRenderer, ModalRenderContext.AddEntities);

        expect(resolveModalRenderer(sq, ModalRenderContext.AddEntities)).toBe(ExactRenderer);
    });
});
