/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ComponentType } from 'react';
import { Query } from '@labkey/api';
import { SchemaQuery, SchemaQueryKey } from '../public/SchemaQuery';
import { ExtendedMap } from '../public/ExtendedMap';
import { SelectRowsResponse } from './query/selectRows';

export type AddEntitiesComplete = (results: ExtendedMap<SchemaQueryKey, SelectRowsResponse>) => void;

export interface ModalRendererProps {
    containerFilter: Query.ContainerFilter;
    containerPath: string;
    onCancel: () => void;
    onComplete: AddEntitiesComplete;
    schemaQuery: SchemaQuery;
}

export type ModalRendererIdentifier = SchemaQuery | string;
export type ModalRendererComponent = ComponentType<ModalRendererProps>;

const modalRenderers: Record<string, ModalRendererComponent | null> = {};

export enum ModalRenderContext {
    AddEntities = 'AddEntities',
}

function getKey(identifier: ModalRendererIdentifier, modalRenderContext: ModalRenderContext): string {
    const id_ = identifierToString(identifier);
    return [id_.toLowerCase(), modalRenderContext].join('|');
}

function identifierToString(identifier: ModalRendererIdentifier): string {
    return identifier instanceof SchemaQuery ? identifier.toString(false) : identifier;
}

/**
 * Register a modal renderer for a specific SchemaQuery or for an entire schema by passing the schema name as a
 * string (e.g., "exp.data"). Registering `null` for a specific identifier explicitly opts it out, taking precedence
 * over any schema-wide registration.
 */
export function registerModalRenderer(
    identifier: ModalRendererIdentifier,
    renderer: ModalRendererComponent | null,
    modalRenderContext = ModalRenderContext.AddEntities
): void {
    modalRenderers[getKey(identifier, modalRenderContext)] = renderer;
}

export function resolveModalRenderer(
    identifier: SchemaQuery,
    modalRenderContext = ModalRenderContext.AddEntities
): ModalRendererComponent {
    const exactKey = getKey(identifier, modalRenderContext);
    if (exactKey in modalRenderers) {
        return modalRenderers[exactKey] ?? undefined;
    }
    if (identifier.schemaName) {
        return modalRenderers[getKey(identifier.schemaName, modalRenderContext)] ?? undefined;
    }
    return undefined;
}
